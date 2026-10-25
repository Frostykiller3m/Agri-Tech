import mongoose from 'mongoose';

import logger from '../utils/logger.js';

let connectionPromise;

export function getMongoUri() {
  return process.env.MONGO_URI || process.env.MONGO_URL;
}

export async function connectDatabase(uri = getMongoUri()) {
  if (!uri) {
    logger.warn('MONGO_URI or MONGO_URL is not configured; starting without a database connection.');
    return null;
  }

  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connectionPromise) return connectionPromise;

  connectionPromise = mongoose.connect(uri)
    .then((connection) => {
      logger.info(`MongoDB connected: ${connection.connection.name}`);
      return connection;
    })
    .finally(() => {
      connectionPromise = undefined;
    });

  return connectionPromise;
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
