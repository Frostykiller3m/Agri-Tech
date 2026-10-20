import cron from 'node-cron';

import Alert from '../models/Alert.js';
import Crop from '../models/Crop.js';
import Farm from '../models/Farm.js';
import Notification from '../models/Notification.js';
import { evaluateAlertRules } from '../services/alertRules.js';
import { getFarmWeather } from '../services/weatherService.js';
import logger from '../utils/logger.js';

export async function runAlertEvaluation(now = new Date()) {
  const farms = await Farm.find().populate({ path: 'owner', select: '_id isActive' }).lean();
  const day = now.toISOString().slice(0, 10);
  let evaluated = 0;
  let created = 0;

  for (const farm of farms) {
    if (!farm.owner?.isActive) continue;
    try {
      const [weather, crops] = await Promise.all([
        getFarmWeather(farm),
        Crop.find({ farm: farm._id, owner: farm.owner._id, status: 'growing' }).select('name status').lean(),
      ]);
      evaluated += 1;
      const matches = evaluateAlertRules(weather, crops);
      for (const match of matches) {
        const dedupeKey = `${farm._id}:${match.ruleKey}:${day}`;
        const alert = await Alert.findOneAndUpdate(
          { dedupeKey },
          { $setOnInsert: {
            ...match,
            farm: farm._id,
            dedupeKey,
            expiresAt: new Date(now.getTime() + 48 * 60 * 60 * 1000),
          } },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        );
        const result = await Notification.updateOne(
          { user: farm.owner._id, alert: alert._id },
          { $setOnInsert: { user: farm.owner._id, alert: alert._id } },
          { upsert: true },
        );
        if (result.upsertedCount) created += 1;
      }
    } catch (error) {
      logger.warn('Alert evaluation skipped a farm', { farmId: String(farm._id), message: error.message });
    }
  }

  return { evaluated, created };
}

export function startAlertEvaluationJob() {
  return cron.schedule('0 4 * * *', async () => {
    try {
      const result = await runAlertEvaluation();
      logger.info('Daily alert evaluation completed', result);
    } catch (error) {
      logger.error('Daily alert evaluation failed', { message: error.message });
    }
  }, { timezone: 'UTC' });
}
