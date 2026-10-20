import { apiClient } from './client.js';

export async function fetchResources(params = {}) {
  const { data } = await apiClient.get('/resources', { params });
  return data.data;
}

export async function fetchResource(id) {
  const { data } = await apiClient.get(`/resources/${id}`);
  return data.data.resource;
}

export async function createResource(payload) {
  const { data } = await apiClient.post('/resources', payload);
  return data.data.resource;
}

export async function updateResourceStatus(id, status) {
  const { data } = await apiClient.patch(`/resources/${id}/status`, { status });
  return data.data.resource;
}
