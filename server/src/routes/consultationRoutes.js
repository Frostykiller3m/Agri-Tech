import { Router } from 'express';

import { addResponse, close, create, getImage, getOne, list } from '../controllers/consultationController.js';
import { authorize, protect } from '../middleware/auth.js';
import { uploadConsultationImages } from '../middleware/consultationUpload.js';
import { validate } from '../middleware/validate.js';
import {
  consultationIdSchema,
  consultationImageParamsSchema,
  consultationListQuerySchema,
  createConsultationSchema,
  responseSchema,
} from '../validators/consultationValidators.js';

const router = Router();

router.use(protect);
router.get('/', validate(consultationListQuerySchema, 'query'), list);
router.post('/', authorize('farmer'), uploadConsultationImages, validate(createConsultationSchema), create);
router.get('/:id/images/:filename', validate(consultationImageParamsSchema, 'params'), getImage);
router.get('/:id', validate(consultationIdSchema, 'params'), getOne);
router.post('/:id/responses', authorize('admin', 'expert'), validate(consultationIdSchema, 'params'), validate(responseSchema), addResponse);
router.patch('/:id/close', authorize('farmer'), validate(consultationIdSchema, 'params'), close);

export default router;
