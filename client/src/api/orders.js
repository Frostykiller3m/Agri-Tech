import { apiClient } from './client.js';

export async function createOrder(payload) {
  const { data } = await apiClient.post('/orders', payload);
  return data.data.order;
}

export async function fetchOrders(params = {}) {
  const { data } = await apiClient.get('/orders', { params });
  return data.data;
}

export async function fetchOrder(id) {
  const { data } = await apiClient.get(`/orders/${id}`);
  return data.data.order;
}

export async function cancelOrder(id) {
  const { data } = await apiClient.patch(`/orders/${id}/cancel`);
  return data.data.order;
}

export async function updateOrderStatus(id, status) {
  const { data } = await apiClient.patch(`/orders/${id}/status`, { status });
  return data.data.order;
}
