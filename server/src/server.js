import 'dotenv/config';

import app from './app.js';
import { connectDatabase } from './config/db.js';
import logger from './utils/logger.js';
import { startAlertEvaluationJob } from './jobs/alertEvaluationJob.js';

const port = Number(process.env.PORT) || 5000;

try {
  await connectDatabase();
  startAlertEvaluationJob();
  app.listen(port, () => logger.info(`Agri-Tech API listening on port ${port}`));
} catch (error) {
  logger.error(error);
  process.exitCode = 1;
}
