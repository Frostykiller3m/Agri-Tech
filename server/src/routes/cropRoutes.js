import { Router } from 'express';

import { authorize, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  create,
  createActivity,
  deleteActivity,
  getOne,
  list,
  remove,
  update,
} from '../controllers/cropController.js';
import { activitySchema, createCropSchema, cropListQuerySchema, updateCropSchema } from '../validators/cropValidators.js';

const router = Router();

router.use(protect);
router.get('/', validate(cropListQuerySchema, 'query'), list);
router.post('/', authorize('farmer', 'admin'), validate(createCropSchema), create);
router.get('/:id', getOne);
router.patch('/:id', authorize('farmer', 'admin'), validate(updateCropSchema), update);
router.delete('/:id', authorize('farmer', 'admin'), remove);
router.post('/:id/activities', authorize('farmer', 'admin'), validate(activitySchema), createActivity);
router.delete('/:id/activities/:activityId', authorize('farmer', 'admin'), deleteActivity);

export default router;
