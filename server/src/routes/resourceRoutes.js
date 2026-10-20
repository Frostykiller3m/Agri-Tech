import { Router } from 'express';

import { create, getOne, list, updateStatus } from '../controllers/resourceController.js';
import { authorize, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createResourceSchema,
  resourceIdSchema,
  resourceListQuerySchema,
  resourceStatusSchema,
} from '../validators/resourceValidators.js';

const router = Router();

router.use(protect);
router.get('/', validate(resourceListQuerySchema, 'query'), list);
router.post('/', authorize('admin'), validate(createResourceSchema), create);
router.get('/:id', validate(resourceIdSchema, 'params'), getOne);
router.patch('/:id/status', authorize('admin'), validate(resourceIdSchema, 'params'), validate(resourceStatusSchema), updateStatus);

export default router;
