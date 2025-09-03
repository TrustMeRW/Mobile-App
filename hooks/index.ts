export { default as useAuth } from './useAuth';
export { default as useCurrentUser } from './useCurrentUser';
export { default as useOptimizedTranslation } from './useOptimizedTranslation';
export { default as useFrameworkReady } from './useFrameworkReady';
export { useAuthContext } from '@/contexts/AuthContext';

// Individual auth hooks
export {
  useLogin,
  useRegister,
  useForgotPassword,
  useResetPassword,
  useUserProfile,
  useValidateToken,
  useRefreshToken,
  useLogout,
  useChangeCode,
} from './useAuth';

// Debt hooks
export {
  useDebts,
  useDebtById,
  useDebtsRequested,
  useDebtsOffered,
  useCreateDebt,
  usePayDebt,
  useConfirmDebtPayment,
} from './useDebts';

// Trustability analytics hooks
export {
  usePersonalTrustabilityAnalytics,
  useUserTrustabilityAnalytics,
  useUserTrustabilityAnalyticsByCode,
} from './useTrustabilityAnalytics';

// WebSocket notifications hook
export {
  useWebSocketNotifications,
} from './useWebSocketNotifications';

// Dashboard hook
export {
  useDashboard,
} from './useDashboard';

// Employment hooks
export {
  useEmploymentsAsEmployer,
  useEmploymentsAsEmployee,
  useEmployment,
  useEmploymentPublicReports,
  useCreateEmployment,
  useFetchEmploymentPublicReports,
  useFetchEmploymentAnalytics,
  useApproveEmployment,
  useRejectEmployment,
  useResignEmployment,
  useConfirmResignation,
  useRejectResignation,
  useFinishEmployment,
  useConfirmFinish,
  useRejectFinish,
  useAllEmployments,
} from './useEmployments';

// Translation hooks
export { useOnboardingTranslations } from './useOnboardingTranslations';
export { useCommonTranslations } from './useCommonTranslations';

// Expo Updates hook
export { useExpoUpdates } from './useExpoUpdates';
