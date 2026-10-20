import Joi from 'joi';

const password = Joi.string().min(8).max(128).required();

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().email().lowercase().required(),
  phone: Joi.string().trim().max(30).allow(''),
  password,
  language: Joi.string().valid('en', 'hi', 'mr').default('en'),
  role: Joi.forbidden(),
});

export const loginSchema = Joi.object({
  email: Joi.string().trim().email().lowercase().required(),
  password,
});

export const languageSchema = Joi.object({
  language: Joi.string().valid('en', 'hi', 'mr').required(),
});
