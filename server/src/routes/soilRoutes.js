import { Router } from 'express';

import { authorize, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { create, getOne, list, recommendations, remove, update } from '../controllers/soilController.js';
import {
  createSoilReportSchema,
  soilListQuerySchema,
  updateSoilReportSchema,
} from '../validators/soilValidators.js';

const router = Router();

router.use(protect);
router.get('/', validate(soilListQuerySchema, 'query'), list);
router.post('/', authorize('farmer', 'admin'), validate(createSoilReportSchema), create);
router.get('/:id/recommendations', recommendations);
router.get('/:id', getOne);
router.patch('/:id', authorize('farmer', 'admin'), validate(updateSoilReportSchema), update);
router.delete('/:id', authorize('farmer', 'admin'), remove);

export default router;
