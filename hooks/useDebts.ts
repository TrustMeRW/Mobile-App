import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, type Debt, type PaginatedResponse } from '@/services/api';
import { Toast } from 'react-native-toast-message/lib/src/Toast';

export interface UseDebtsParams {
  status?: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | 'REJECTED' | 'OVERDUE';
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  page?: number;
  includeRequested?: boolean;
  includeOffered?: boolean;
}

export function useDebts(params: UseDebtsParams = {}) {
  return useQuery({
    queryKey: ['debts', params],
    queryFn: () => apiClient.getMyDebts(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useDebtById(id: string) {
  return useQuery({
    queryKey: ['debt', id],
    queryFn: () => apiClient.getDebtById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useDebtsRequested(params: Omit<UseDebtsParams, 'includeRequested' | 'includeOffered'> = {}) {
  return useQuery({
    queryKey: ['debts-requested', params],
    queryFn: () => apiClient.getDebtsRequested(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useDebtsOffered(params: Omit<UseDebtsParams, 'includeRequested' | 'includeOffered'> = {}) {
  return useQuery({
    queryKey: ['debts-offered', params],
    queryFn: () => apiClient.getDebtsOffered(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCreateDebt() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (debtData: { 
      items: Array<{ name: string; description: string; quantity: number; amount: number }>;
      dueDate: Date | null;
      selectedUser: any;
      intiationType: 'REQUEST' | 'offer';
    }) => {
      const { items, dueDate, selectedUser, intiationType } = debtData;
      
      if (intiationType === 'REQUEST') {
        return apiClient.requestDebt(
          selectedUser?.id || '',
          items,
          dueDate ? dueDate.toISOString().split('T')[0] : undefined
        );
      } else {
        return apiClient.offerDebt(
          selectedUser?.id || '',
          items,
          dueDate ? dueDate.toISOString().split('T')[0] : undefined
        );
      }
    },
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Debt created successfully!',
      });
      queryClient.invalidateQueries({ queryKey: ['debts'] });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to create debt',
      });
    },
  });
}

export function usePayDebt() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { debtId: string; amount: string }) =>
      apiClient.payDebt(data.debtId, data.amount),
    onSuccess: (_, variables) => {
      Toast.show({
        type: 'success',
        text1: 'Payment Successful',
        text2: 'Debt payment has been processed successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['debt', variables.debtId] });
      queryClient.invalidateQueries({ queryKey: ['debts'] });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 'Failed to process payment';
      Toast.show({
        type: 'error',
        text1: 'Payment Failed',
        text2: errorMessage,
      });
    },
  });
}

export function useConfirmDebtPayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { debtId: string; pin: string }) =>
      apiClient.confirmDebtPayment(data.debtId, data.pin),
    onSuccess: (_, variables) => {
      Toast.show({
        type: 'success',
        text1: 'Debt Confirmed',
        text2: 'Debt payment has been confirmed successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['debt', variables.debtId] });
      queryClient.invalidateQueries({ queryKey: ['debts'] });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 'Failed to confirm debt payment';
      Toast.show({
        type: 'error',
        text1: 'Confirmation Failed',
        text2: errorMessage,
      });
    },
  });
}
