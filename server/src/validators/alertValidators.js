import Joi from 'joi';

export const createAlertSchema = Joi.object({
  type: Joi.string().valid('pest', 'weather', 'general').required(),
  severity: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
  title: Joi.string().trim().min(3).max(140).required(),
  message: Joi.string().trim().min(3).max(2000).required(),
  region: Joi.object({
    state: Joi.string().trim().min(1).max(100).required(),
    district: Joi.string().trim().min(1).max(100),
  }).required(),
  cropFilter: Joi.array().items(Joi.string().trim().min(2).max(100)).default([]),
  expiresAt: Joi.date().iso().greater('now').allow(null),
}).required();

export const createExpertAlertSchema = createAlertSchema.fork('type', (schema) => schema.valid('general', 'pest').invalid('weather'));

export const listAlertsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export const notificationIdSchema = Joi.object({ id: Joi.string().hex().length(24).required() });
