import Joi from 'joi';

const objectId = Joi.string().hex().length(24);

export const createConsultationSchema = Joi.object({
  farmId: objectId.allow('', null),
  cropId: objectId.allow('', null),
  topic: Joi.string().trim().min(3).max(160).required(),
  description: Joi.string().trim().min(5).max(10000).required(),
});

export const responseSchema = Joi.object({
  message: Joi.string().trim().min(1).max(5000).required(),
});

export const consultationListQuerySchema = Joi.object({
  status: Joi.string().valid('open', 'answered', 'closed'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export const consultationIdSchema = Joi.object({ id: objectId.required() });
export const consultationImageParamsSchema = Joi.object({
  id: objectId.required(),
  filename: Joi.string().pattern(/^[0-9a-f-]{36}\.(?:jpg|png|gif|webp)$/i).required(),
});
