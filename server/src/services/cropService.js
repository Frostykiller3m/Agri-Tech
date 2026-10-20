import mongoose from 'mongoose';

import Crop from '../models/Crop.js';
import Farm from '../models/Farm.js';

function ensureValidId(id, message = 'Crop not found') {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error(message);
    error.statusCode = 404;
    throw error;
  }
}

function accessFilter(user) {
  return user.role === 'admin' ? {} : { owner: user._id };
}

function notFoundError(message = 'Crop not found') {
  const error = new Error(message);
  error.statusCode = 404;
  return error;
}

function assertHarvestAfterSowing(sowingDate, expectedHarvestDate) {
  if (new Date(expectedHarvestDate) <= new Date(sowingDate)) {
    const error = new Error('Expected harvest date must be after sowing date');
    error.statusCode = 400;
    throw error;
  }
}

async function getAccessibleFarm(user, farmId) {
  ensureValidId(farmId, 'Farm not found');
  const farm = await Farm.findOne({
    _id: farmId,
    ...(user.role === 'admin' ? {} : { owner: user._id }),
  }).lean();
  if (!farm) throw notFoundError('Farm not found');
  return farm;
}

export async function listCrops(user, { farmId, page, limit }) {
  await getAccessibleFarm(user, farmId);
  const filter = { farm: farmId, ...accessFilter(user) };
  const [crops, total] = await Promise.all([
    Crop.find(filter)
      .select(
        'farm owner name variety sowingDate expectedHarvestDate status yieldKg activityLog createdAt updatedAt',
      )
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Crop.countDocuments(filter),
  ]);
  return {
    crops,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function createCrop(user, { farmId, ...cropData }) {
  const farm = await getAccessibleFarm(user, farmId);
  assertHarvestAfterSowing(cropData.sowingDate, cropData.expectedHarvestDate);
  const crop = await Crop.create({ ...cropData, farm: farm._id, owner: farm.owner });
  return crop;
}

export async function getCrop(user, id) {
  ensureValidId(id);
  const crop = await Crop.findOne({ _id: id, ...accessFilter(user) }).lean();
  if (!crop) throw notFoundError();
  return crop;
}

export async function updateCrop(user, id, cropData) {
  ensureValidId(id);
  const existing = await Crop.findOne({ _id: id, ...accessFilter(user) }).lean();
  if (!existing) throw notFoundError();
  const nextSowingDate = cropData.sowingDate ?? existing.sowingDate;
  const nextHarvestDate = cropData.expectedHarvestDate ?? existing.expectedHarvestDate;
  assertHarvestAfterSowing(nextSowingDate, nextHarvestDate);
  return Crop.findOneAndUpdate({ _id: id, ...accessFilter(user) }, cropData, {
    new: true,
    runValidators: true,
  }).lean();
}

export async function deleteCrop(user, id) {
  ensureValidId(id);
  const crop = await Crop.findOneAndDelete({ _id: id, ...accessFilter(user) });
  if (!crop) throw notFoundError();
}

export async function addActivity(user, id, activity) {
  ensureValidId(id);
  const crop = await Crop.findOne({ _id: id, ...accessFilter(user) });
  if (!crop) throw notFoundError();
  crop.activityLog.push(activity);
  await crop.save();
  return crop;
}

export async function removeActivity(user, id, activityId) {
  ensureValidId(id);
  ensureValidId(activityId, 'Activity not found');
  const crop = await Crop.findOne({ _id: id, ...accessFilter(user) });
  if (!crop) throw notFoundError();
  const activity = crop.activityLog.id(activityId);
  if (!activity) throw notFoundError('Activity not found');
  activity.deleteOne();
  await crop.save();
  return crop;
}
