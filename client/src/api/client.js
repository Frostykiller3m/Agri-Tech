import axios from 'axios';

const defaultApiUrl = import.meta.env.DEV && typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname}:5000`
  : 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultApiUrl,
  withCredentials: true,
});

let authHandlers = {
  getAccessToken: () => null,
  refreshAccessToken: async () => null,
  onAuthFailure: () => {},
};
let refreshPromise = null;

export function configureAuthClient(handlers) {
  authHandlers = { ...authHandlers, ...handlers };
}

apiClient.interceptors.request.use((config) => {
  const token = authHandlers.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || '';
    const isAuthRequest = ['/auth/login', '/auth/register', '/auth/refresh'].some((path) =>
      requestUrl.includes(path),
    );

    if (error.response?.status !== 401 || originalRequest?._retry || isAuthRequest) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    refreshPromise ??= authHandlers.refreshAccessToken().finally(() => {
      refreshPromise = null;
    });

    const nextToken = await refreshPromise;
    if (!nextToken) {
      authHandlers.onAuthFailure();
      return Promise.reject(error);
    }

    originalRequest.headers.Authorization = `Bearer ${nextToken}`;
    return apiClient(originalRequest);
  },
);
