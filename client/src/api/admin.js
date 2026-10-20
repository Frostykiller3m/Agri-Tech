import { apiClient } from './client.js';

export async function fetchAdminStats() {
  const { data } = await apiClient.get('/admin/stats');
  return data.data;
}

export async function fetchAdminUsers(params = {}) {
  const { data } = await apiClient.get('/admin/users', { params });
  return data.data;
}

export async function updateAdminUser(id, changes) {
  const { data } = await apiClient.patch(`/admin/users/${id}`, changes);
  return data.data.user;
}

export async function fetchAdminResources(params = {}) {
  const { data } = await apiClient.get('/admin/resources', { params });
  return data.data;
}

export async function setAdminResourceStatus(id, status) {
  const { data } = await apiClient.patch(`/admin/resources/${id}/status`, { status });
  return data.data.resource;
}

export async function fetchAdminOrders(params = {}) {
  const { data } = await apiClient.get('/admin/orders', { params });
  return data.data;
}

export async function setAdminOrderStatus(id, status) {
  const { data } = await apiClient.patch(`/admin/orders/${id}/status`, { status });
  return data.data.order;
}

export async function publishAdminAlert(payload) {
  const { data } = await apiClient.post('/admin/alerts', payload);
  return data.data;
}

export async function fetchAdminReports(params = {}) {
  const { data } = await apiClient.get('/admin/reports', { params });
  return data.data;
}

export async function setAdminReportStatus(id, status) {
  const { data } = await apiClient.patch(`/admin/reports/${id}`, { status });
  return data.data.report;
}
