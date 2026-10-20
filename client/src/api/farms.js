import { apiClient } from './client.js';

export async function fetchFarms(params = {}) {
  const { data } = await apiClient.get('/farms', { params });
  return data.data;
}

export async function fetchFarm(id) {
  const { data } = await apiClient.get(`/farms/${id}`);
  return data.data.farm;
}

export async function createFarm(payload) {
  const { data } = await apiClient.post('/farms', payload);
  return data.data.farm;
}

export async function updateFarm(id, payload) {
  const { data } = await apiClient.patch(`/farms/${id}`, payload);
  return data.data.farm;
}

export async function deleteFarm(id) {
  await apiClient.delete(`/farms/${id}`);
}
