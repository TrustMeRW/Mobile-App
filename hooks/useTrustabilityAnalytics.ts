import { useQuery } from '@tanstack/react-query';
import { apiClient, type TrustabilityAnalyticsResponse } from '@/services/api';

export function usePersonalTrustabilityAnalytics() {
  return useQuery({
    queryKey: ['trustability-analytics', 'personal'],
    queryFn: () => apiClient.getPersonalTrustabilityAnalytics(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useUserTrustabilityAnalytics(userId: string) {
  return useQuery({
    queryKey: ['trustability-analytics', 'user', userId],
    queryFn: () => apiClient.getUserTrustabilityAnalytics(userId),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useUserTrustabilityAnalyticsByCode(code: string) {
  return useQuery({
    queryKey: ['trustability-analytics', 'code', code],
    queryFn: () => apiClient.getUserTrustabilityAnalyticsByCode(code),
    enabled: !!code,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

