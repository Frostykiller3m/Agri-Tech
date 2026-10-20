import mongoose from 'mongoose';

import Farm from '../models/Farm.js';
import SoilReport from '../models/SoilReport.js';
import { soilRecommendations } from './soilRecommendation.js';

function notFoundError(message = 'Soil report not found') {
  const error = new Error(message);
  error.statusCode = 404;
  return error;
}

function validateId(id, message) {
  if (!mongoose.isValidObjectId(id)) throw notFoundError(message);
}

function ownerFilter(user) {
  return user.role === 'admin' ? {} : { owner: user._id };
}

async function accessibleFarm(user, farmId) {
  validateId(farmId, 'Farm not found');
  const farm = await Farm.findOne({
    _id: farmId,
    ...(user.role === 'admin' ? {} : { owner: user._id }),
  }).lean();
  if (!farm) throw notFoundError('Farm not found');
  return farm;
}

export async function listSoilReports(user, { farmId, page, limit }) {
  const farm = await accessibleFarm(user, farmId);
  const filter = { farm: farm._id, ...ownerFilter(user) };
  const [reports, total] = await Promise.all([
    SoilReport.find(filter)
      .select(
        'farm owner date pH nitrogen phosphorus potassium moisture organicCarbon createdAt updatedAt',
      )
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    SoilReport.countDocuments(filter),
  ]);
  return { reports, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function createSoilReport(user, { farmId, ...reportData }) {
  const farm = await accessibleFarm(user, farmId);
  return SoilReport.create({ ...reportData, farm: farm._id, owner: farm.owner });
}

export async function getSoilReport(user, id) {
  validateId(id);
  const report = await SoilReport.findOne({ _id: id, ...ownerFilter(user) }).lean();
  if (!report) throw notFoundError();
  return report;
}

export async function updateSoilReport(user, id, updates) {
  validateId(id);
  const report = await SoilReport.findOneAndUpdate({ _id: id, ...ownerFilter(user) }, updates, {
    new: true,
    runValidators: true,
  }).lean();
  if (!report) throw notFoundError();
  return report;
}

export async function deleteSoilReport(user, id) {
  validateId(id);
  const report = await SoilReport.findOneAndDelete({ _id: id, ...ownerFilter(user) });
  if (!report) throw notFoundError();
}

export async function getRecommendations(user, id) {
  const report = await getSoilReport(user, id);
  return { reportId: report._id, recommendations: soilRecommendations(report) };
}
