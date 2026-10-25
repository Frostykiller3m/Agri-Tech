import 'dotenv/config';

import cors from 'cors';
import cropRoutes from './routes/cropRoutes.js';
import express from 'express';
import rateLimit from 'express-rate-limit';
import soilRoutes from './routes/soilRoutes.js';
import weatherRoutes from './routes/weatherRoutes.js';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';

import requestLogger from './middleware/requestLogger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import farmRoutes from './routes/farmRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import forumRoutes from './routes/forumRoutes.js';
import consultationRoutes from './routes/consultationRoutes.js';
import { runAlertEvaluation } from './jobs/alertEvaluationJob.js';
import { connectDatabase, getMongoUri } from './config/db.js';

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const clientOrigin = process.env.CLIENT_URL || (isProduction ? '' : 'http://localhost:5173');
const allowedClientOrigins = new Set([clientOrigin]);

if (!clientOrigin) {
  throw new Error('CLIENT_URL must be configured in production');
}
if (isProduction) {
  const parsedClientOrigin = new URL(clientOrigin);
  if (parsedClientOrigin.protocol !== 'https:' || parsedClientOrigin.origin !== clientOrigin) {
    throw new Error(
      'CLIENT_URL must be an HTTPS origin without a path or trailing slash in production',
    );
  }
} else {
  const localOrigin = new URL(clientOrigin);
  if (localOrigin.hostname === 'localhost' || localOrigin.hostname === '127.0.0.1') {
    for (const hostname of ['localhost', '127.0.0.1']) {
      localOrigin.hostname = hostname;
      allowedClientOrigins.add(localOrigin.origin);
    }
  }
}

app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedClientOrigins.has(origin)) return callback(null, true);
      return callback(new Error('Origin is not allowed by CORS'));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(async (request, _response, next) => {
  if (!process.env.VERCEL
    || (request.method === 'GET' && request.path === '/health')
    || (request.method === 'GET' && request.path === '/internal/cron/alerts')) {
    return next();
  }

  if (!getMongoUri()) {
    return next(new Error('MONGO_URI or MONGO_URL must be configured for Vercel API requests'));
  }

  try {
    await connectDatabase();
    return next();
  } catch (error) {
    return next(error);
  }
});
// Express 5 exposes req.query through a getter. Shadow it with a writable copy
// so security middleware can normalize it without assigning to that getter.
app.use((request, _response, next) => {
  Object.defineProperty(request, 'query', {
    configurable: true,
    enumerable: true,
    writable: true,
    value: { ...request.query },
  });
  next();
});
app.use(mongoSanitize());
app.use(hpp());
app.use(requestLogger);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  }),
);

app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/farms', farmRoutes);
app.use('/crops', cropRoutes);
app.use('/soil', soilRoutes);
app.use('/weather', weatherRoutes);
app.use('/alerts', alertRoutes);
app.use('/notifications', notificationRoutes);
app.use('/resources', resourceRoutes);
app.use('/orders', orderRoutes);
app.use('/forum', forumRoutes);
app.use('/consultations', consultationRoutes);

app.get('/health', (_request, response) => {
  response.status(200).json({
    success: true,
    data: {
      status: 'ok',
      service: 'agri-tech-api',
      timestamp: new Date().toISOString(),
    },
  });
});

app.get('/internal/cron/alerts', async (request, response, next) => {
  if (!process.env.VERCEL) return response.sendStatus(404);

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return response.sendStatus(503);
  if (request.headers.authorization !== `Bearer ${cronSecret}`) {
    return response.sendStatus(401);
  }

  try {
    if (!getMongoUri()) throw new Error('MONGO_URI or MONGO_URL must be configured for Vercel API requests');
    await connectDatabase();
    const result = await runAlertEvaluation();
    return response.status(200).json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
