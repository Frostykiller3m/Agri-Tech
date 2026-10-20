import mongoose from 'mongoose';

import logger from '../utils/logger.js';

export async function connectDatabase(uri = process.env.MONGO_URI) {
  if (!uri) {
    logger.warn('MONGO_URI is not configured; starting without a database connection.');
    return null;
  }

  const connection = await mongoose.connect(uri);
  logger.info(`MongoDB connected: ${connection.connection.name}`);
  return connection;
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
