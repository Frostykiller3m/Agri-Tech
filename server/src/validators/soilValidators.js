import Joi from 'joi';

const objectId = Joi.string().hex().length(24);

const reportFields = {
  farmId: objectId,
  date: Joi.date().iso(),
  pH: Joi.number().min(0).max(14),
  nitrogen: Joi.number().min(0).max(10000),
  phosphorus: Joi.number().min(0).max(10000),
  potassium: Joi.number().min(0).max(10000),
  moisture: Joi.number().min(0).max(100),
  organicCarbon: Joi.number().min(0).max(100),
};

export const createSoilReportSchema = Joi.object({
  ...reportFields,
  farmId: reportFields.farmId.required(),
  date: reportFields.date.required(),
  pH: reportFields.pH.required(),
  nitrogen: reportFields.nitrogen.required(),
  phosphorus: reportFields.phosphorus.required(),
  potassium: reportFields.potassium.required(),
  moisture: reportFields.moisture.required(),
  organicCarbon: reportFields.organicCarbon.required(),
});

export const updateSoilReportSchema = Joi.object({
  date: reportFields.date,
  pH: reportFields.pH,
  nitrogen: reportFields.nitrogen,
  phosphorus: reportFields.phosphorus,
  potassium: reportFields.potassium,
  moisture: reportFields.moisture,
  organicCarbon: reportFields.organicCarbon,
}).min(1);

export const soilListQuerySchema = Joi.object({
  farmId: objectId.required(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});
