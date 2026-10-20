import { Router } from 'express';

import { createAlert, getAlerts } from '../controllers/alertController.js';
import { authorize, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createAlertSchema, createExpertAlertSchema, listAlertsQuerySchema } from '../validators/alertValidators.js';

const router = Router();

router.get('/', protect, validate(listAlertsQuerySchema, 'query'), getAlerts);
router.post('/', protect, authorize('admin', 'expert'), (request, response, next) => {
  const schema = request.user.role === 'expert' ? createExpertAlertSchema : createAlertSchema;
  return validate(schema)(request, response, next);
}, createAlert);

export default router;
