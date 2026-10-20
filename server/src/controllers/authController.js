import {
  getActiveUserById,
  issueTokens,
  loginUser,
  registerUser,
  toPublicUser,
  updateUserLanguage,
} from '../services/authService.js';
import { verifyRefreshToken } from '../utils/auth.js';
import { clearRefreshCookie, parseCookies, REFRESH_COOKIE_NAME, setRefreshCookie } from '../utils/cookies.js';

export async function register(request, response) {
  const result = await registerUser(request.body);
  setRefreshCookie(response, result.refreshToken);
  response.status(201).json({
    success: true,
    data: { user: result.user, accessToken: result.accessToken },
  });
}

export async function login(request, response) {
  const result = await loginUser(request.body);
  setRefreshCookie(response, result.refreshToken);
  response.status(200).json({
    success: true,
    data: { user: result.user, accessToken: result.accessToken },
  });
}

export async function refresh(request, response) {
  const token = parseCookies(request.headers.cookie)[REFRESH_COOKIE_NAME];
  if (!token) {
    const error = new Error('Refresh token is required');
    error.statusCode = 401;
    throw error;
  }

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    const error = new Error('Invalid refresh token');
    error.statusCode = 401;
    throw error;
  }
  const user = await getActiveUserById(payload.sub);
  if (!user) {
    const error = new Error('User is inactive or no longer exists');
    error.statusCode = 401;
    throw error;
  }

  const result = issueTokens(user);
  setRefreshCookie(response, result.refreshToken);
  response.status(200).json({
    success: true,
    data: { user: result.user, accessToken: result.accessToken },
  });
}

export function logout(_request, response) {
  clearRefreshCookie(response);
  response.status(200).json({ success: true, data: { message: 'Logged out successfully' } });
}

export function me(request, response) {
  response.status(200).json({ success: true, data: { user: toPublicUser(request.user) } });
}

export async function updateLanguage(request, response) {
  const user = await updateUserLanguage(request.user._id, request.body.language);
  response.status(200).json({ success: true, data: { user } });
}
