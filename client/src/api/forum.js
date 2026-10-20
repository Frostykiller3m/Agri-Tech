import { apiClient } from './client.js';

export async function fetchPosts(params = {}) {
  const { data } = await apiClient.get('/forum/posts', { params });
  return data.data;
}

export async function fetchPost(id) {
  const { data } = await apiClient.get(`/forum/posts/${id}`);
  return data.data.post;
}

export async function createPost(payload) {
  const { data } = await apiClient.post('/forum/posts', payload);
  return data.data.post;
}

export async function updatePost(id, payload) {
  const { data } = await apiClient.patch(`/forum/posts/${id}`, payload);
  return data.data.post;
}

export async function deletePost(id) {
  await apiClient.delete(`/forum/posts/${id}`);
}

export async function togglePostLike(id) {
  const { data } = await apiClient.post(`/forum/posts/${id}/like`);
  return data.data.post;
}

export async function fetchComments(postId, params = {}) {
  const { data } = await apiClient.get(`/forum/posts/${postId}/comments`, { params });
  return data.data;
}

export async function createComment(postId, body) {
  const { data } = await apiClient.post(`/forum/posts/${postId}/comments`, { body });
  return data.data.comment;
}

export async function updateComment(id, body) {
  const { data } = await apiClient.patch(`/forum/comments/${id}`, { body });
  return data.data.comment;
}

export async function deleteComment(id) {
  await apiClient.delete(`/forum/comments/${id}`);
}

export async function reportContent(payload) {
  const { data } = await apiClient.post('/forum/report', payload);
  return data.data.report;
}

export async function setPostHidden(id, isHidden) {
  const { data } = await apiClient.patch(`/forum/posts/${id}/moderation`, { isHidden });
  return data.data.post;
}

export async function fetchReports(params = {}) {
  const { data } = await apiClient.get('/forum/reports', { params });
  return data.data;
}

export async function updateReport(id, status) {
  const { data } = await apiClient.patch(`/forum/reports/${id}`, { status });
  return data.data.report;
}
