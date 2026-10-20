import alertRules from '../config/alertRules.js';

const finite = (value) => Number.isFinite(Number(value));

export function evaluateAlertRules(weather, crops = [], rules = alertRules) {
  if (!weather?.current || !weather?.daily) return [];

  const alerts = [];
  const temperature = Number(weather.current.temperature_2m);
  const humidity = Number(weather.current.relative_humidity_2m);
  const cropNames = new Set(crops
    .filter((crop) => crop.status === 'growing')
    .map((crop) => crop.name.trim().toLowerCase()));
  const matchedCrops = rules.pest.crops.filter((crop) => cropNames.has(crop.toLowerCase()));

  if (matchedCrops.length && finite(temperature) && finite(humidity)
    && humidity >= rules.pest.minHumidity
    && temperature >= rules.pest.minTemperature
    && temperature <= rules.pest.maxTemperature) {
    alerts.push({
      type: 'pest',
      severity: 'high',
      title: 'Pest risk conditions detected',
      message: `Warm, humid conditions may increase pest pressure on ${matchedCrops.join(', ')}. Inspect crops and follow local integrated pest-management guidance.`,
      ruleKey: `pest-warm-humid-${matchedCrops.sort().join('-')}`,
      cropFilter: matchedCrops,
    });
  }

  const rainChance = Number(weather.daily.precipitation_probability_max?.[0]);
  const maxTemperature = Number(weather.daily.temperature_2m_max?.[0]);
  if (finite(rainChance) && rainChance >= rules.weather.highRainProbability) {
    alerts.push({
      type: 'weather',
      severity: 'high',
      title: 'Heavy rain is likely',
      message: `The forecast indicates a ${rainChance}% chance of precipitation. Check drainage and protect vulnerable crops.`,
      ruleKey: 'weather-high-rain',
    });
  }
  if (finite(maxTemperature) && maxTemperature >= rules.weather.extremeMaxTemperature) {
    alerts.push({
      type: 'weather',
      severity: 'high',
      title: 'High temperature forecast',
      message: `The forecast maximum is ${maxTemperature}°C. Monitor crop heat stress and soil moisture.`,
      ruleKey: 'weather-extreme-heat',
    });
  }
  return alerts;
}
