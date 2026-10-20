import { apiClient } from './client.js';

export async function fetchSoilReports(farmId) {
  const { data } = await apiClient.get('/soil', { params: { farmId } });
  return data.data;
}

export async function createSoilReport(payload) {
  const { data } = await apiClient.post('/soil', payload);
  return data.data.report;
}

export async function deleteSoilReport(id) {
  await apiClient.delete(`/soil/${id}`);
}

export async function fetchSoilRecommendations(id) {
  const { data } = await apiClient.get(`/soil/${id}/recommendations`);
  return data.data.recommendations;
}
