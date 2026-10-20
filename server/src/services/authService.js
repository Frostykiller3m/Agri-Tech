import User from '../models/User.js';
import {
  comparePassword,
  createAccessToken,
  createRefreshToken,
  hashPassword,
} from '../utils/auth.js';

function publicUser(user) {
  const returnedUser = user.toObject ? user.toObject() : { ...user };
  delete returnedUser.passwordHash;
  delete returnedUser.__v;
  return returnedUser;
}

export async function registerUser({ name, email, phone, password, language }) {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error('An account with this email already exists');
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({
    name,
    email,
    phone,
    passwordHash: await hashPassword(password),
    language,
  });

  return issueTokens(user);
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash');
  const validPassword = user && (await comparePassword(password, user.passwordHash));
  if (!validPassword || !user.isActive) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  return issueTokens(user);
}

export function issueTokens(user) {
  return {
    user: publicUser(user),
    accessToken: createAccessToken(user),
    refreshToken: createRefreshToken(user),
  };
}

export async function getActiveUserById(id) {
  const user = await User.findById(id);
  if (!user || !user.isActive) return null;
  return user;
}

export async function updateUserLanguage(id, language) {
  const user = await User.findOneAndUpdate(
    { _id: id, isActive: true },
    { language },
    { new: true, runValidators: true },
  );
  if (!user) {
    const error = new Error('User is inactive or no longer exists');
    error.statusCode = 404;
    throw error;
  }
  return publicUser(user);
}

export function toPublicUser(user) {
  return publicUser(user);
}
