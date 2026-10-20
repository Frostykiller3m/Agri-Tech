import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '30d';
const BCRYPT_ROUNDS = 12;

function getSecret(name) {
  const value = process.env[name];
  if (value) return value;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${name} must be configured in production`);
  }
  return `local-only-${name.toLowerCase()}-change-me`;
}

export function createAccessToken(user) {
  return jwt.sign({ role: user.role }, getSecret('JWT_SECRET'), {
    subject: user._id.toString(),
    expiresIn: ACCESS_TOKEN_TTL,
  });
}

export function createRefreshToken(user) {
  return jwt.sign({ type: 'refresh' }, getSecret('JWT_REFRESH_SECRET'), {
    subject: user._id.toString(),
    expiresIn: REFRESH_TOKEN_TTL,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, getSecret('JWT_SECRET'));
}

export function verifyRefreshToken(token) {
  const payload = jwt.verify(token, getSecret('JWT_REFRESH_SECRET'));
  if (payload.type !== 'refresh') {
    throw new jwt.JsonWebTokenError('Invalid refresh token');
  }
  return payload;
}

export function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export function comparePassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

export { BCRYPT_ROUNDS, ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL };
