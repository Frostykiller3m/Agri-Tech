import User from '../models/User.js';
import { verifyAccessToken } from '../utils/auth.js';

export async function protect(request, _response, next) {
  try {
    const authorization = request.headers.authorization || '';
    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token) {
      const error = new Error('Authentication required');
      error.statusCode = 401;
      throw error;
    }

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select('-passwordHash').lean();
    if (!user || !user.isActive) {
      const error = new Error('User is inactive or no longer exists');
      error.statusCode = 401;
      throw error;
    }

    request.user = user;
    next();
  } catch (error) {
    error.statusCode = 401;
    next(error);
  }
}

export function authorize(...roles) {
  return (request, _response, next) => {
    if (!request.user || !roles.includes(request.user.role)) {
      const error = new Error('You do not have permission to perform this action');
      error.statusCode = 403;
      return next(error);
    }
    return next();
  };
}
