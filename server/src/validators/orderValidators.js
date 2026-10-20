import Joi from 'joi';

const objectId = Joi.string().hex().length(24);

export const createOrderSchema = Joi.object({
  items: Joi.array().items(Joi.object({
    resource: objectId.required(),
    qty: Joi.number().integer().min(1).max(100000).required(),
  })).min(1).max(100).required(),
  deliveryAddress: Joi.object({
    recipientName: Joi.string().trim().min(2).max(100).required(),
    phone: Joi.string().trim().pattern(/^[+\d()\-\s]{8,30}$/).required(),
    addressLine1: Joi.string().trim().min(3).max(200).required(),
    addressLine2: Joi.string().trim().max(200).allow('').default(''),
    city: Joi.string().trim().min(2).max(100).required(),
    state: Joi.string().trim().min(2).max(100).required(),
    postalCode: Joi.string().trim().pattern(/^[A-Za-z0-9\s-]{3,20}$/).required(),
  }).required(),
});

export const orderListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid('placed', 'approved', 'shipped', 'delivered', 'cancelled'),
});

export const orderIdSchema = Joi.object({ id: objectId.required() });

export const orderStatusSchema = Joi.object({
  status: Joi.string().valid('approved', 'shipped', 'delivered', 'cancelled').required(),
});
