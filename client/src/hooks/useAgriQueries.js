import { useQuery } from '@tanstack/react-query';

import { fetchFarm, fetchFarms } from '../api/farms.js';
import { fetchResources } from '../api/resources.js';
import { fetchFarmWeather } from '../api/weather.js';

export function useFarmList(user, page = 1, limit = 20) {
  const userId = user?._id || user?.id;
  return useQuery({
    queryKey: ['farms', userId, page, limit],
    queryFn: () => fetchFarms({ page, limit }),
    enabled: Boolean(userId),
  });
}

export function useFarm(user, farmId) {
  const userId = user?._id || user?.id;
  return useQuery({
    queryKey: ['farms', userId, 'detail', farmId],
    queryFn: () => fetchFarm(farmId),
    enabled: Boolean(userId && farmId),
  });
}

export function useResourceList(user, params) {
  const userId = user?._id || user?.id;
  return useQuery({
    queryKey: ['resources', userId, params],
    queryFn: () => fetchResources(params),
    enabled: Boolean(userId),
  });
}

export function useFarmWeather(farmId, cacheScope) {
  return useQuery({
    queryKey: ['weather', cacheScope, farmId],
    queryFn: () => fetchFarmWeather(farmId, cacheScope),
    enabled: Boolean(farmId && cacheScope),
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
  });
}
