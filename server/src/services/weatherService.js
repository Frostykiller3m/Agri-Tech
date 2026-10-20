import WeatherData from '../models/WeatherData.js';

const CACHE_DURATION_MS = 2 * 60 * 60 * 1000;
const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

function buildProviderUrl([longitude, latitude]) {
  const url = new URL(OPEN_METEO_URL);
  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'is_day',
      'precipitation',
      'weather_code',
      'wind_speed_10m',
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
      'precipitation_probability_max',
    ].join(','),
    forecast_days: '7',
    timezone: 'auto',
  }).toString();
  return url;
}

async function fetchProviderWeather(coordinates) {
  const response = await fetch(buildProviderUrl(coordinates), {
    signal: AbortSignal.timeout(10000),
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Weather provider returned ${response.status}`);
  const payload = await response.json();
  if (!payload.current || !payload.daily) throw new Error('Weather provider returned an incomplete forecast');
  return payload;
}

export async function getFarmWeather(farm) {
  const now = new Date();
  const cacheFloor = new Date(now.getTime() - CACHE_DURATION_MS);
  const fresh = await WeatherData.findOne({ farm: farm._id, fetchedAt: { $gte: cacheFloor } })
    .sort({ fetchedAt: -1 })
    .lean();

  if (fresh) return { ...fresh.payload, stale: false, fetchedAt: fresh.fetchedAt };

  try {
    const payload = await fetchProviderWeather(farm.location.coordinates);
    const cacheRecord = await WeatherData.create({ farm: farm._id, fetchedAt: now, payload });
    return { ...payload, stale: false, fetchedAt: cacheRecord.fetchedAt };
  } catch (providerError) {
    const stale = await WeatherData.findOne({ farm: farm._id }).sort({ fetchedAt: -1 }).lean();
    if (stale) return { ...stale.payload, stale: true, fetchedAt: stale.fetchedAt };

    const error = new Error('Weather is temporarily unavailable');
    error.statusCode = 503;
    error.cause = providerError;
    throw error;
  }
}

export { CACHE_DURATION_MS, buildProviderUrl };
