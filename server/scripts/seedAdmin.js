import 'dotenv/config';

import mongoose from 'mongoose';

import { connectDatabase, disconnectDatabase } from '../src/config/db.js';
import User from '../src/models/User.js';
import { hashPassword } from '../src/utils/auth.js';
import logger from '../src/utils/logger.js';

const required = ['ADMIN_NAME', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];

try {
  for (const key of required) {
    if (!process.env[key]) throw new Error(`${key} must be configured before seeding an admin`);
  }

  await connectDatabase();
  if (mongoose.connection.readyState !== 1)
    throw new Error('MONGO_URI must be configured before seeding an admin');

  const passwordHash = await hashPassword(process.env.ADMIN_PASSWORD);
  const resetPassword = process.env.ADMIN_RESET_PASSWORD === 'true';
  const update = {
    $set: {
      name: process.env.ADMIN_NAME,
      phone: process.env.ADMIN_PHONE || undefined,
      role: 'admin',
      language: 'en',
      isActive: true,
      ...(resetPassword ? { passwordHash } : {}),
    },
    ...(!resetPassword ? { $setOnInsert: { passwordHash } } : {}),
  };

  const admin = await User.findOneAndUpdate(
    { email: process.env.ADMIN_EMAIL.toLowerCase() },
    update,
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  logger.info(`Admin ready: ${admin.email}`);
} finally {
  await disconnectDatabase();
}
