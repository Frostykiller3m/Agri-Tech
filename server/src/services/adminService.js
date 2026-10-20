import mongoose from 'mongoose';

import Consultation from '../models/Consultation.js';
import Crop from '../models/Crop.js';
import Farm from '../models/Farm.js';
import Order from '../models/Order.js';
import Report from '../models/Report.js';
import User from '../models/User.js';

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function ensureId(id) {
  if (!mongoose.isValidObjectId(id)) throw httpError(404, 'User not found');
}

function escapedRegex(value) {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

export async function getAdminStats() {
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCMonth(start.getUTCMonth() - 11);

  const [users, farms, activeCrops, openConsultations, pendingReports, orderGroups, signupGroups] = await Promise.all([
    User.countDocuments(),
    Farm.countDocuments(),
    Crop.countDocuments({ status: { $in: ['planned', 'growing'] } }),
    Consultation.countDocuments({ status: 'open' }),
    Report.countDocuments({ status: 'pending' }),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    User.aggregate([
      { $match: { createdAt: { $gte: start } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: 'UTC' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const orderCounts = Object.fromEntries(orderGroups.map(({ _id, count }) => [_id, count]));
  const signupCounts = new Map(signupGroups.map(({ _id, count }) => [_id, count]));
  const signups = Array.from({ length: 12 }, (_, index) => {
    const month = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index, 1));
    const key = month.toISOString().slice(0, 7);
    return { month: key, count: signupCounts.get(key) || 0 };
  });

  return {
    counts: { users, farms, activeCrops, openConsultations, pendingReports },
    ordersByStatus: ['placed', 'approved', 'shipped', 'delivered', 'cancelled'].map((status) => ({ status, count: orderCounts[status] || 0 })),
    signups,
  };
}

export async function listUsers({ search, role, isActive, page, limit }) {
  const filter = {
    ...(role ? { role } : {}),
    ...(isActive === undefined ? {} : { isActive }),
    ...(search ? { $or: [{ name: escapedRegex(search) }, { email: escapedRegex(search) }] } : {}),
  };
  const [users, total] = await Promise.all([
    User.find(filter).select('name email phone role isActive createdAt').sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter),
  ]);
  return { users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function updateUser(admin, id, changes) {
  ensureId(id);
  if (String(admin._id) === String(id) && changes.isActive === false) {
    throw httpError(409, 'You cannot deactivate your own account');
  }
  const user = await User.findByIdAndUpdate(id, { $set: changes }, { new: true, runValidators: true })
    .select('name email phone role isActive createdAt').lean();
  if (!user) throw httpError(404, 'User not found');
  return user;
}
