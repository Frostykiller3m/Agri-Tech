import Joi from 'joi';

const objectId = Joi.string().hex().length(24);
const status = Joi.string().valid('planned', 'growing', 'harvested', 'failed');
const activityType = Joi.string().valid('irrigation', 'fertilizer', 'pesticide', 'other');

const cropFields = {
  name: Joi.string().trim().min(2).max(100),
  variety: Joi.string().trim().max(100).allow(''),
  sowingDate: Joi.date().iso(),
  expectedHarvestDate: Joi.date().iso(),
  status,
  yieldKg: Joi.number().min(0),
};

export const createCropSchema = Joi.object({
  farmId: objectId.required(),
  ...cropFields,
  name: cropFields.name.required(),
  sowingDate: cropFields.sowingDate.required(),
  expectedHarvestDate: cropFields.expectedHarvestDate.required().greater(Joi.ref('sowingDate')),
});

export const updateCropSchema = Joi.object(cropFields).min(1);

export const cropListQuerySchema = Joi.object({
  farmId: objectId.required(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export const activitySchema = Joi.object({
  type: activityType.required(),
  date: Joi.date().iso().required(),
  notes: Joi.string().trim().max(500).allow(''),
  quantity: Joi.number().min(0),
});
