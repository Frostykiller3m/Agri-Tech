import mongoose from 'mongoose';

import Farm from '../models/Farm.js';

function ensureValidFarmId(id) {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error('Farm not found');
    error.statusCode = 404;
    throw error;
  }
}

function ownerFilter(user) {
  return user.role === 'admin' ? {} : { owner: user._id };
}

function notFoundError() {
  const error = new Error('Farm not found');
  error.statusCode = 404;
  return error;
}

export async function listFarms(user, { page, limit }) {
  const filter = ownerFilter(user);
  const [farms, total] = await Promise.all([
    Farm.find(filter)
      .select(
        'owner name location district state areaInAcres soilType irrigationType createdAt updatedAt',
      )
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('owner', 'name email role')
      .lean(),
    Farm.countDocuments(filter),
  ]);

  return {
    farms,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function createFarm(user, farmData) {
  const farm = await Farm.create({ ...farmData, owner: user._id });
  return farm.populate('owner', 'name email role');
}

export async function getFarm(user, id) {
  ensureValidFarmId(id);
  const farm = await Farm.findOne({ _id: id, ...ownerFilter(user) })
    .populate('owner', 'name email role')
    .lean();
  if (!farm) throw notFoundError();
  return farm;
}

export async function updateFarm(user, id, farmData) {
  ensureValidFarmId(id);
  const farm = await Farm.findOneAndUpdate({ _id: id, ...ownerFilter(user) }, farmData, {
    new: true,
    runValidators: true,
  }).populate('owner', 'name email role');
  if (!farm) throw notFoundError();
  return farm;
}

export async function deleteFarm(user, id) {
  ensureValidFarmId(id);
  const farm = await Farm.findOneAndDelete({ _id: id, ...ownerFilter(user) });
  if (!farm) throw notFoundError();
}
