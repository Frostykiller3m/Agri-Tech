import logger from '../utils/logger.js';

export function notFoundHandler(request, response) {
  response.status(404).json({
    success: false,
    message: `Route not found: ${request.method} ${request.originalUrl}`,
    errors: [],
  });
}

export function errorHandler(error, _request, response, _next) {
  logger.error(error);

  const statusCode = error.statusCode || error.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  const message =
    statusCode >= 500 && isProduction
      ? 'Internal server error'
      : error.message || 'Internal server error';

  response.status(statusCode).json({
    success: false,
    message,
    errors: isProduction && statusCode >= 500 ? [] : error.details || [],
  });
}
