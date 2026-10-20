import mongoose from 'mongoose';

import Farm from '../models/Farm.js';
import { getFarmWeather } from './weatherService.js';

export async function getWeatherForUser(user, farmId) {
  if (!mongoose.isValidObjectId(farmId)) {
    const error = new Error('Farm not found');
    error.statusCode = 404;
    throw error;
  }

  const farm = await Farm.findOne({
    _id: farmId,
    ...(user.role === 'admin' ? {} : { owner: user._id }),
  }).lean();

  if (!farm) {
    const error = new Error('Farm not found');
    error.statusCode = 404;
    throw error;
  }

  return getFarmWeather(farm);
}
