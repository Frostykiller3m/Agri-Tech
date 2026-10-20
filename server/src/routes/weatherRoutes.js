import { Router } from 'express';

import { getWeather } from '../controllers/weatherController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { weatherCacheQuerySchema } from '../validators/weatherValidators.js';

const router = Router();

router.get('/:farmId', protect, validate(weatherCacheQuerySchema, 'query'), getWeather);

export default router;
