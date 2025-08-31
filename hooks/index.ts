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
