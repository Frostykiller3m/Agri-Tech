import Joi from 'joi';

export const weatherCacheQuerySchema = Joi.object({
  cacheScope: Joi.string().pattern(/^[A-Za-z0-9-]{16,100}$/),
});
