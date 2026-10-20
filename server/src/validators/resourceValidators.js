import Joi from 'joi';

export const createResourceSchema = Joi.object({
  name: Joi.string().trim().min(2).max(140).required(),
  category: Joi.string().valid('seed', 'fertilizer', 'pesticide', 'equipment').required(),
  description: Joi.string().trim().min(5).max(3000).required(),
  price: Joi.number().min(0).max(100000000).required(),
  stock: Joi.number().integer().min(0).max(100000000).required(),
  unit: Joi.string().trim().min(1).max(40).required(),
  imageUrl: Joi.string().uri({ scheme: ['http', 'https'] }).max(2048).allow(''),
});

export const resourceStatusSchema = Joi.object({
  status: Joi.string().valid('approved', 'rejected').required(),
});

export const resourceListQuerySchema = Joi.object({
  search: Joi.string().trim().max(100).allow(''),
  category: Joi.string().valid('seed', 'fertilizer', 'pesticide', 'equipment'),
  status: Joi.string().valid('pending', 'approved', 'rejected'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export const resourceIdSchema = Joi.object({ id: Joi.string().hex().length(24).required() });
