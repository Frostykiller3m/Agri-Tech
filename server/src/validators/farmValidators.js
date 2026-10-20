import Joi from 'joi';

const location = Joi.object({
  type: Joi.string().valid('Point').required(),
  coordinates: Joi.array().length(2).items(Joi.number().required()).custom((coordinates, helpers) => {
    const [longitude, latitude] = coordinates;
    if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
      return helpers.error('location.range');
    }
    return coordinates;
  }).required(),
}).messages({ 'location.range': 'Location must use [longitude, latitude] within valid ranges' });

const farmFields = {
  name: Joi.string().trim().min(2).max(100),
  location,
  district: Joi.string().trim().min(2).max(100),
  state: Joi.string().trim().min(2).max(100),
  areaInAcres: Joi.number().positive().max(1000000),
  soilType: Joi.string().valid('clay', 'sandy', 'loamy', 'silty', 'peaty', 'chalky', 'other'),
  irrigationType: Joi.string().valid('rainfed', 'drip', 'sprinkler', 'canal', 'well', 'other'),
};

export const createFarmSchema = Joi.object({
  ...farmFields,
  name: farmFields.name.required(),
  location: farmFields.location.required(),
  district: farmFields.district.required(),
  state: farmFields.state.required(),
  areaInAcres: farmFields.areaInAcres.required(),
  soilType: farmFields.soilType.required(),
  irrigationType: farmFields.irrigationType.required(),
});

export const updateFarmSchema = Joi.object(farmFields).min(1);

export const farmListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});
