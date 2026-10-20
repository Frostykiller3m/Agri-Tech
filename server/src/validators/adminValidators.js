import Joi from 'joi';

const objectId = Joi.string().hex().length(24);

export const adminUserListSchema = Joi.object({
  search: Joi.string().trim().max(100).allow(''),
  role: Joi.string().valid('farmer', 'expert', 'admin'),
  isActive: Joi.boolean(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export const adminUserIdSchema = Joi.object({ id: objectId.required() });

export const adminUserUpdateSchema = Joi.object({
  role: Joi.string().valid('farmer', 'expert', 'admin'),
  isActive: Joi.boolean(),
}).min(1);

export const adminOrderStatusSchema = Joi.object({ status: Joi.string().valid('approved', 'shipped', 'delivered', 'cancelled').required() });

export const adminReportIdSchema = Joi.object({ id: objectId.required() });
export const adminReportStatusSchema = Joi.object({ status: Joi.string().valid('reviewed', 'dismissed').required() });
