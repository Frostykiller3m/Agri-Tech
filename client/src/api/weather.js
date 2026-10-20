import { apiClient } from './client.js';

export async function fetchFarmWeather(farmId, cacheScope) {
  const { data } = await apiClient.get(`/weather/${farmId}`, { params: { cacheScope } });
  return data.data.weather;
}
