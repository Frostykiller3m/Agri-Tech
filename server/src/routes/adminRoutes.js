import { Router } from 'express';

import { authorize, protect } from '../middleware/auth.js';
import {
  orderStatus,
  orders,
  publishAlert,
  reportStatus,
  reports,
  resourceQueue,
  resourceStatus,
  stats,
  updateUserRoute,
  users,
} from '../controllers/adminController.js';
import { validate } from '../middleware/validate.js';
import { createAlertSchema } from '../validators/alertValidators.js';
import {
  adminOrderStatusSchema,
  adminReportIdSchema,
  adminReportStatusSchema,
  adminUserIdSchema,
  adminUserListSchema,
  adminUserUpdateSchema,
} from '../validators/adminValidators.js';
import { reportListQuerySchema } from '../validators/forumValidators.js';
import { orderIdSchema, orderListQuerySchema } from '../validators/orderValidators.js';
import { resourceIdSchema, resourceListQuerySchema, resourceStatusSchema } from '../validators/resourceValidators.js';

const router = Router();

router.use(protect, authorize('admin'));

router.get('/ping', (_request, response) => {
  response.status(200).json({ success: true, data: { status: 'admin-access-granted' } });
});

router.get('/stats', stats);
router.get('/users', validate(adminUserListSchema, 'query'), users);
router.patch('/users/:id', validate(adminUserIdSchema, 'params'), validate(adminUserUpdateSchema), updateUserRoute);
router.get('/resources', validate(resourceListQuerySchema, 'query'), resourceQueue);
router.patch('/resources/:id/status', validate(resourceIdSchema, 'params'), validate(resourceStatusSchema), resourceStatus);
router.get('/orders', validate(orderListQuerySchema, 'query'), orders);
router.patch('/orders/:id/status', validate(orderIdSchema, 'params'), validate(adminOrderStatusSchema), orderStatus);
router.post('/alerts', validate(createAlertSchema), publishAlert);
router.get('/reports', validate(reportListQuerySchema, 'query'), reports);
router.patch('/reports/:id', validate(adminReportIdSchema, 'params'), validate(adminReportStatusSchema), reportStatus);

export default router;
