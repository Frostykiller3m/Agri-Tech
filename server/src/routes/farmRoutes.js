import { Router } from 'express';

import { authorize, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { create, getOne, list, remove, update } from '../controllers/farmController.js';
import { createFarmSchema, farmListQuerySchema, updateFarmSchema } from '../validators/farmValidators.js';

const router = Router();

router.use(protect);
router.get('/', validate(farmListQuerySchema, 'query'), list);
router.post('/', authorize('farmer', 'admin'), validate(createFarmSchema), create);
router.get('/:id', getOne);
router.patch('/:id', authorize('farmer', 'admin'), validate(updateFarmSchema), update);
router.delete('/:id', authorize('farmer', 'admin'), remove);

export default router;
