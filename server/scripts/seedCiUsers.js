import 'dotenv/config';

import mongoose from 'mongoose';

import { connectDatabase, disconnectDatabase } from '../src/config/db.js';
import User from '../src/models/User.js';
import { hashPassword } from '../src/utils/auth.js';
import logger from '../src/utils/logger.js';

const roleUsers = [
  { role: 'admin', prefix: 'CI_ADMIN' },
  { role: 'expert', prefix: 'CI_EXPERT' },
];

try {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('CI user seeding is allowed only with NODE_ENV=test');
  }

  for (const { prefix } of roleUsers) {
    for (const suffix of ['NAME', 'EMAIL', 'PASSWORD']) {
      const key = `${prefix}_${suffix}`;
      if (!process.env[key]) throw new Error(`${key} must be configured to seed CI users`);
    }
  }

  await connectDatabase();
  if (mongoose.connection.readyState !== 1) {
    throw new Error('MONGO_URI must point to the disposable CI database');
  }
  if (mongoose.connection.name !== 'agri_tech_ci') {
    throw new Error('CI user seeding is restricted to the agri_tech_ci database');
  }

  for (const { role, prefix } of roleUsers) {
    const email = process.env[`${prefix}_EMAIL`].toLowerCase();
    await User.findOneAndUpdate(
      { email },
      {
        $set: {
          name: process.env[`${prefix}_NAME`],
          role,
          language: 'en',
          isActive: true,
        },
        $setOnInsert: {
          passwordHash: await hashPassword(process.env[`${prefix}_PASSWORD`]),
        },
      },
      { upsert: true, setDefaultsOnInsert: true },
    );
  }

  logger.info('CI admin and expert accounts are ready.');
} finally {
  await disconnectDatabase();
}
