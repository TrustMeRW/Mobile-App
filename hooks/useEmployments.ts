import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api';
import { Employment, CreateEmploymentDto, EmploymentFilters, EmploymentReport } from '@/types/api';

// Get employments as employer
export const useEmploymentsAsEmployer = (filters?: EmploymentFilters) => {
  return useQuery({
    queryKey: ['employments', 'as-employer', filters],
    queryFn: () => apiClient.getEmploymentsAsEmployer(filters),
    select: (data) => data.payload,
  });
};

// Get employments as employee
export const useEmploymentsAsEmployee = (filters?: EmploymentFilters) => {
  return useQuery({
    queryKey: ['employments', 'as-employee', filters],
    queryFn: () => apiClient.getEmploymentsAsEmployee(filters),
    select: (data) => data.payload,
  });
};

// Get employment by ID
export const useEmployment = (id: string) => {
  return useQuery({
    queryKey: ['employment', id],
    queryFn: () => apiClient.getEmploymentById(id),
    select: (data) => data.payload,
    enabled: !!id,
  });
};

// Get employment public reports
export const useEmploymentPublicReports = (userCode: string) => {
  return useQuery({
    queryKey: ['employment', 'public-reports', userCode],
    queryFn: () => apiClient.getEmploymentPublicReports(userCode),
    select: (data) => data.payload,
    enabled: !!userCode,
  });
};

// Create employment mutation
export const useCreateEmployment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEmploymentDto) => apiClient.createEmployment(data),
    onSuccess: () => {
      // Invalidate and refetch employment queries
      queryClient.invalidateQueries({ queryKey: ['employments'] });
    },
  });
};

// Fetch employment public reports mutation (for manual fetching)
export const useFetchEmploymentPublicReports = () => {
  return useMutation({
    mutationFn: (userCode: string) => apiClient.getEmploymentPublicReports(userCode),
  });
};

// Fetch employment analytics mutation (for manual fetching)
export const useFetchEmploymentAnalytics = () => {
  return useMutation({
    mutationFn: (userCode: string) => apiClient.getEmploymentAnalytics(userCode),
  });
};

// Employment Action Hooks
export const useApproveEmployment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, pin }: { id: string; pin: string }) => apiClient.approveEmployment(id, pin),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employment', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['employments'] });
    },
  });
};

export const useRejectEmployment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, pin }: { id: string; pin: string }) => apiClient.rejectEmployment(id, pin),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employment', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['employments'] });
    },
  });
};

export const useResignEmployment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, pin }: { id: string; pin: string }) => apiClient.resignEmployment(id, pin),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employment', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['employments'] });
    },
  });
};

export const useConfirmResignation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, pin }: { id: string; pin: string }) => apiClient.confirmResignation(id, pin),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employment', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['employments'] });
    },
  });
};

export const useRejectResignation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, pin }: { id: string; pin: string }) => apiClient.rejectResignation(id, pin),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employment', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['employments'] });
    },
  });
};

export const useFinishEmployment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, pin }: { id: string; pin: string }) => apiClient.finishEmployment(id, pin),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employment', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['employments'] });
    },
  });
};

export const useConfirmFinish = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, pin }: { id: string; pin: string }) => apiClient.confirmFinish(id, pin),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employment', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['employments'] });
    },
  });
};

export const useRejectFinish = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, pin }: { id: string; pin: string }) => apiClient.rejectFinish(id, pin),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employment', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['employments'] });
    },
  });
};

// Combined hook for all employments (both as employer and employee)
export const useAllEmployments = (filters?: EmploymentFilters) => {
  const employerQuery = useEmploymentsAsEmployer(filters);
  const employeeQuery = useEmploymentsAsEmployee(filters);

  return {
    employerEmployments: employerQuery.data?.data || [],
    employeeEmployments: employeeQuery.data?.data || [],
    allEmployments: [
      ...(employerQuery.data?.data || []),
      ...(employeeQuery.data?.data || [])
    ],
    isLoading: employerQuery.isLoading || employeeQuery.isLoading,
    isError: employerQuery.isError || employeeQuery.isError,
    error: employerQuery.error || employeeQuery.error,
    refetch: () => {
      employerQuery.refetch();
      employeeQuery.refetch();
    },
    employerPagination: employerQuery.data?.pagination,
    employeePagination: employeeQuery.data?.pagination,
  };
};
