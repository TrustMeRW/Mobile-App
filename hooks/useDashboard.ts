import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api';

export const useDashboard = () => {
  return useQuery({
    queryKey: ['user-dashboard'],
    queryFn: () => apiClient.getUserDashboard(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};
