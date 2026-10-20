import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { login, logout, me, refresh, register, updateLanguage } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { languageSchema, loginSchema, registerSchema } from '../validators/authValidators.js';

const router = Router();
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { success: false, message: 'Too many authentication attempts; try again later', errors: [] },
});

router.post('/register', authRateLimit, validate(registerSchema), register);
router.post('/login', authRateLimit, validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', protect, me);
router.patch('/me/language', protect, validate(languageSchema), updateLanguage);

export default router;
