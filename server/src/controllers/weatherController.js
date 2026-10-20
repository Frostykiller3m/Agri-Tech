import { getWeatherForUser } from '../services/weatherAccessService.js';

export async function getWeather(request, response) {
  const weather = await getWeatherForUser(request.user, request.params.farmId);
  response.status(200).json({ success: true, data: { weather } });
}
