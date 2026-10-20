import { apiClient } from './client.js';

export async function fetchCrops(farmId) {
  const { data } = await apiClient.get('/crops', { params: { farmId } });
  return data.data;
}

export async function createCrop(payload) {
  const { data } = await apiClient.post('/crops', payload);
  return data.data.crop;
}

export async function updateCrop(id, payload) {
  const { data } = await apiClient.patch(`/crops/${id}`, payload);
  return data.data.crop;
}

export async function deleteCrop(id) {
  await apiClient.delete(`/crops/${id}`);
}

export async function addCropActivity(id, payload) {
  const { data } = await apiClient.post(`/crops/${id}/activities`, payload);
  return data.data.crop;
}

export async function deleteCropActivity(cropId, activityId) {
  const { data } = await apiClient.delete(`/crops/${cropId}/activities/${activityId}`);
  return data.data.crop;
}
