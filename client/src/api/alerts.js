import { apiClient } from './client.js';

export async function createAlert(payload) {
  const { data } = await apiClient.post('/alerts', payload);
  return data.data;
}

export async function fetchNotifications(params = {}) {
  const { data } = await apiClient.get('/notifications', { params });
  return data.data;
}

export async function markNotificationRead(id) {
  const { data } = await apiClient.patch(`/notifications/${id}/read`);
  return data.data.notification;
}
