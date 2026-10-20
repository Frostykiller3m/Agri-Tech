import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import i18n from '../i18n.js';
import { apiClient, configureAuthClient } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [weatherCacheScope, setWeatherCacheScope] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const tokenRef = useRef(null);
  const cacheScopeRef = useRef(null);
  const cacheScopeUserRef = useRef(null);

  const clearSession = useCallback(() => {
    tokenRef.current = null;
    cacheScopeRef.current = null;
    cacheScopeUserRef.current = null;
    setAccessToken(null);
    setUser(null);
    setWeatherCacheScope(null);
  }, []);

  const setSession = useCallback((nextUser, nextToken) => {
    const nextUserId = String(nextUser?._id || nextUser?.id || '');
    if (!cacheScopeRef.current || cacheScopeUserRef.current !== nextUserId) {
      cacheScopeRef.current = globalThis.crypto?.randomUUID?.() || `${Date.now()}${Math.random().toString(36).slice(2)}`;
      cacheScopeUserRef.current = nextUserId;
      setWeatherCacheScope(cacheScopeRef.current);
    }
    tokenRef.current = nextToken;
    setAccessToken(nextToken);
    setUser(nextUser);
    if (nextUser?.language) void i18n.changeLanguage(nextUser.language);
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const { data } = await apiClient.post('/auth/refresh');
      setSession(data.data.user, data.data.accessToken);
      return data.data.accessToken;
    } catch {
      clearSession();
      return null;
    }
  }, [clearSession, setSession]);

  useEffect(() => {
    configureAuthClient({
      getAccessToken: () => tokenRef.current,
      refreshAccessToken: refreshSession,
      onAuthFailure: clearSession,
    });

    refreshSession().finally(() => setIsLoading(false));
  }, [clearSession, refreshSession]);

  const login = useCallback(async (credentials) => {
    const { data } = await apiClient.post('/auth/login', credentials);
    setSession(data.data.user, data.data.accessToken);
    return data.data.user;
  }, [setSession]);

  const register = useCallback(async (details) => {
    const { data } = await apiClient.post('/auth/register', details);
    setSession(data.data.user, data.data.accessToken);
    return data.data.user;
  }, [setSession]);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const updateLanguage = useCallback(async (language) => {
    const { data } = await apiClient.patch('/auth/me/language', { language });
    setUser(data.data.user);
    await i18n.changeLanguage(language);
  }, []);

  const value = useMemo(
    () => ({
      accessToken,
      user,
      weatherCacheScope,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      refreshSession,
      updateLanguage,
    }),
    [accessToken, user, weatherCacheScope, isLoading, login, register, logout, refreshSession, updateLanguage],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// The hook is intentionally colocated with its provider so consumers share one context contract.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
