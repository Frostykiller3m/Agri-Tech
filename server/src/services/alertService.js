import mongoose from 'mongoose';

import Alert from '../models/Alert.js';
import Crop from '../models/Crop.js';
import Farm from '../models/Farm.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

function invalidId() {
  const error = new Error('Notification not found');
  error.statusCode = 404;
  return error;
}

export async function createRegionalAlert(creator, alertData) {
  if (!['admin', 'expert'].includes(creator.role)) {
    const error = new Error('Only admins and experts can publish alerts');
    error.statusCode = 403;
    throw error;
  }
  if (creator.role === 'expert' && !['general', 'pest'].includes(alertData.type)) {
    const error = new Error('Experts may publish only general or pest alerts');
    error.statusCode = 403;
    throw error;
  }
  const alert = await Alert.create({ ...alertData, createdBy: creator._id });
  const matchingFarms = await Farm.find({
    state: alert.region.state,
    ...(alert.region.district ? { district: alert.region.district } : {}),
  })
    .select('_id owner')
    .lean();
  let eligibleFarms = matchingFarms;
  if (alert.cropFilter.length) {
    const cropPatterns = alert.cropFilter.map(
      (name) => new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    );
    const crops = await Crop.find({
      farm: { $in: matchingFarms.map((farm) => farm._id) },
      name: { $in: cropPatterns },
    }).distinct('farm');
    const cropFarmIds = new Set(crops.map(String));
    eligibleFarms = matchingFarms.filter((farm) => cropFarmIds.has(String(farm._id)));
  }
  const ownerIds = [...new Set(eligibleFarms.map((farm) => String(farm.owner)))];
  const users = await User.find({
    _id: { $in: ownerIds },
    role: 'farmer',
    isActive: true,
  }).distinct('_id');
  if (users.length) {
    await Notification.bulkWrite(
      users.map((user) => ({
        updateOne: {
          filter: { user, alert: alert._id },
          update: { $setOnInsert: { user, alert: alert._id } },
          upsert: true,
        },
      })),
      { ordered: false },
    );
  }
  return { alert, recipientCount: users.length };
}

export async function listAlerts(user, { page, limit }) {
  if (user.role === 'admin') {
    const filter = { $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] };
    const [alerts, total] = await Promise.all([
      Alert.find(filter)
        .select(
          'type severity title message region farm cropFilter createdBy expiresAt createdAt updatedAt',
        )
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('createdBy', 'name role')
        .lean(),
      Alert.countDocuments(filter),
    ]);
    return { alerts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  const [farms, crops] = await Promise.all([
    Farm.find({ owner: user._id }).select('_id state district').lean(),
    Crop.find({ owner: user._id, status: 'growing' }).select('name').lean(),
  ]);
  const farmIds = farms.map((farm) => farm._id);
  const regionClauses = [
    ...new Map(
      farms.map((farm) => [
        `${farm.state.toLowerCase()}|${farm.district.toLowerCase()}`,
        {
          'region.state': farm.state,
          $or: [{ 'region.district': null }, { 'region.district': farm.district }],
        },
      ]),
    ).values(),
  ];
  const cropNames = crops.map((crop) => crop.name.toLowerCase());
  const applicable = [{ farm: { $in: farmIds } }, ...regionClauses];
  const filter = {
    $and: [
      { $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] },
      { $or: applicable.length ? applicable : [{ _id: null }] },
      {
        $or: [
          { cropFilter: { $exists: false } },
          { cropFilter: { $size: 0 } },
          { cropFilter: { $in: cropNames } },
        ],
      },
    ],
  };
  const [alerts, total] = await Promise.all([
    Alert.find(filter)
      .select(
        'type severity title message region farm cropFilter createdBy expiresAt createdAt updatedAt',
      )
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'name role')
      .lean(),
    Alert.countDocuments(filter),
  ]);
  return { alerts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function listNotifications(user, { page, limit }) {
  const activeAlerts = await Alert.find({
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  }).distinct('_id');
  const filter = { user: user._id, alert: { $in: activeAlerts } };
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .select('user alert readAt createdAt updatedAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({ path: 'alert', populate: { path: 'createdBy', select: 'name role' } })
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, readAt: null }),
  ]);
  return {
    notifications,
    unreadCount,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function markNotificationRead(user, id) {
  if (!mongoose.isValidObjectId(id)) throw invalidId();
  const notification = await Notification.findOneAndUpdate(
    { _id: id, user: user._id },
    { $set: { readAt: new Date() } },
    { new: true },
  )
    .populate('alert')
    .lean();
  if (!notification) throw invalidId();
  return notification;
}
