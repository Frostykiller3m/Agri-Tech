import { apiClient } from './client.js';

export async function fetchConsultations(params = {}) {
  const { data } = await apiClient.get('/consultations', { params });
  return data.data;
}

export async function fetchConsultation(id) {
  const { data } = await apiClient.get(`/consultations/${id}`);
  return data.data.consultation;
}

export async function createConsultation(payload) {
  const { data } = await apiClient.post('/consultations', payload);
  return data.data.consultation;
}

export async function addConsultationResponse(id, message) {
  const { data } = await apiClient.post(`/consultations/${id}/responses`, { message });
  return data.data.consultation;
}

export async function closeConsultation(id) {
  const { data } = await apiClient.patch(`/consultations/${id}/close`);
  return data.data.consultation;
}

export async function fetchConsultationImage(path) {
  const { data } = await apiClient.get(path, { responseType: 'blob' });
  return URL.createObjectURL(data);
}
