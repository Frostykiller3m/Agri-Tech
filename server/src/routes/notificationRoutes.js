import { Router } from 'express';

import { getNotifications, readNotification } from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { listAlertsQuerySchema, notificationIdSchema } from '../validators/alertValidators.js';

const router = Router();

router.get('/', protect, validate(listAlertsQuerySchema, 'query'), getNotifications);
router.patch('/:id/read', protect, validate(notificationIdSchema, 'params'), readNotification);

export default router;
