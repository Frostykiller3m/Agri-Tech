import { Router } from 'express';

import { cancel, create, getOne, list, updateStatus } from '../controllers/orderController.js';
import { authorize, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createOrderSchema, orderIdSchema, orderListQuerySchema, orderStatusSchema } from '../validators/orderValidators.js';

const router = Router();

router.use(protect);
router.get('/', authorize('farmer', 'admin'), validate(orderListQuerySchema, 'query'), list);
router.post('/', authorize('farmer'), validate(createOrderSchema), create);
router.get('/:id', authorize('farmer', 'admin'), validate(orderIdSchema, 'params'), getOne);
router.patch('/:id/cancel', authorize('farmer'), validate(orderIdSchema, 'params'), cancel);
router.patch('/:id/status', authorize('admin'), validate(orderIdSchema, 'params'), validate(orderStatusSchema), updateStatus);

export default router;
