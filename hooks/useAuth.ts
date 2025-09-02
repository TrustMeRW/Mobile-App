import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthService, LoginRequest, RegisterRequest, ForgotPasswordRequest, ResetPasswordRequest, UserProfile } from '@/services/auth';
import { apiClient } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import { TokenStorage } from '@/utils/tokenStorage';
import { UserStorage, StoredUserData } from '@/utils/userStorage';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { User } from '@/types/api';

export const useLogin = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  
  return useMutation({
    mutationFn: (data: LoginRequest) => AuthService.login(data),
    onSuccess: async (data) => {
      if (data.success && data.token) {
        try {
          // Store tokens
          await TokenStorage.setAccessToken(data.token);
          if (data.refreshToken) {
            await TokenStorage.setRefreshToken(data.refreshToken);
          }
          
          // Store user data locally if provided
          if (data.user) {
            await UserStorage.setUserData(data.user);
          }
          
          // Invalidate and refetch user profile to ensure fresh data
          await queryClient.invalidateQueries({ queryKey: ['user-profile'] });
          await queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
          
          // Force refetch the current user data
          await queryClient.refetchQueries({ queryKey: ['user-profile'] });
          
          showSuccess('Welcome!', 'You have successfully logged in', 2000);
        } catch (error) {
          console.error('Error during login success handling:', error);
          showError('Login Error', 'Failed to complete login process. Please try again.', 3000);
        }
      } else {
        showError('Login Failed', data.message || 'Invalid credentials', 3000);
      }
    },
    onError: (error: any) => {
      showError('Login Error', error.message || 'Something went wrong. Please try again.', 5000);
    },
  });
};

export const useRegister = () => {
  const { showSuccess, showError } = useToast();
  
  return useMutation({
    mutationFn: (data: RegisterRequest) => AuthService.register(data),
    onSuccess: (data) => {
      if (data.success) {
        showSuccess('Registration Successful', data.message || 'Your account has been created successfully', 3000);
      } else {
        showError('Registration Failed', data.message || 'Failed to create account', 3000);
      }
    },
    onError: (error: any) => {
      showError('Registration Error', error.message || 'Something went wrong. Please try again.', 5000);
    },
  });
};

export const useForgotPassword = () => {
  const { showSuccess, showError } = useToast();
  
  return useMutation({
    mutationFn: (data: ForgotPasswordRequest) => AuthService.forgotPassword(data),
    onSuccess: (data) => {
      if (data.success) {
        showSuccess('Reset Link Sent', data.message || 'Check your email for password reset instructions', 3000);
      } else {
        showError('Reset Failed', data.message || 'Failed to send reset link', 3000);
      }
    },
    onError: (error: any) => {
      showError('Reset Error', error.message || 'Something went wrong. Please try again.', 5000);
    },
  });
};

export const useResetPassword = () => {
  const { showSuccess, showError } = useToast();
  
  return useMutation({
    mutationFn: (data: ResetPasswordRequest) => AuthService.resetPassword(data),
    onSuccess: (data) => {
      if (data.success) {
        showSuccess('Password Reset', data.message || 'Your password has been reset successfully', 3000);
      } else {
        showError('Reset Failed', data.message || 'Failed to reset password', 3000);
      }
    },
    onError: (error: any) => {
      showError('Reset Error', error.message || 'Something went wrong. Please try again.', 5000);
    },
  });
};

export const useUserProfile = (token: string | null) => {
  return useQuery({
    queryKey: ['auth', 'profile', token],
    queryFn: () => token ? AuthService.getUserProfile(token) : null,
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    select: (data) => data?.user || null,
  });
};

export const useValidateToken = (token: string | null) => {
  return useQuery({
    queryKey: ['auth', 'validate', token],
    queryFn: () => token ? AuthService.validateToken(token) : false,
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (replaces cacheTime in newer versions)
  });
};

export const useRefreshToken = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (refreshToken: string) => AuthService.refreshToken(refreshToken),
    onSuccess: (data) => {
      if (data.success) {
        // Invalidate and refetch auth-related queries
        queryClient.invalidateQueries({ queryKey: ['auth'] });
      }
    },
    onError: (error) => {
      // Handle token refresh failure (e.g., redirect to login)
      console.error('Token refresh failed:', error);
    },
  });
};

export const useLogout = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();
  const { showSuccess } = useToast();
  
  return useMutation({
    mutationFn: (token: string) => AuthService.logout(token),
    onSuccess: async () => {
      // Clear tokens and user data
      await Promise.all([
        TokenStorage.clearTokens(),
        UserStorage.clearUserData(),
      ]);
      // Clear all queries from cache
      queryClient.clear();
      showSuccess('Logged Out', 'You have been successfully logged out', 2000);
      
      // Call the success callback if provided
      if (onSuccessCallback) {
        // Use setTimeout to ensure state updates are complete
        setTimeout(onSuccessCallback, 100);
      }
    },
    onError: async (error) => {
      // Even if logout API fails, clear local state
      await Promise.all([
        TokenStorage.clearTokens(),
        UserStorage.clearUserData(),
      ]);
      queryClient.clear();
      console.error('Logout error:', error);
    },
  });
};

export const useChangeCode = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  
  return useMutation({
    mutationFn: (pin: string) => apiClient.changeCode(pin),
    onSuccess: async (data) => {
      showSuccess('Code Changed', 'Your user code has been successfully changed', 3000);
      // Invalidate and refetch user profile to get the new code
      await queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      await queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
      await queryClient.refetchQueries({ queryKey: ['user-profile'] });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 'Failed to change code. Please try again.';
      showError('Change Code Failed', errorMessage, 5000);
    },
  });
};

// Main useAuth hook that provides all auth functionality
export const useAuth = () => {
  const [user, setUser] = useState<StoredUserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await TokenStorage.getAccessToken();
        if (token) {
          const userData = await UserStorage.getUserData();
          if (userData) {
            setUser(userData);
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (identifier: string, password: string) => {
    try {
      const loginMutation = useLogin();
      const result = await loginMutation.mutateAsync({ identifier, password });
      if (result.success) {
        setIsAuthenticated(true);
        return { success: true };
      } else {
        return { success: false, error: result.message };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      const token = await TokenStorage.getAccessToken();
      if (token) {
        const logoutMutation = useLogout(() => {
          setIsAuthenticated(false);
          setUser(null);
          router.replace('/(auth)');
        });
        await logoutMutation.mutateAsync(token);
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      setIsAuthenticated(false);
      setUser(null);
      router.replace('/(auth)');
    }
  };

  const getToken = async (): Promise<string | null> => {
    return await TokenStorage.getAccessToken();
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    getToken,
    setUser,
  };
};

// Default export containing all auth hooks
export default {
  useLogin,
  useRegister,
  useForgotPassword,
  useResetPassword,
  useUserProfile,
  useValidateToken,
  useRefreshToken,
  useLogout,
  useChangeCode,
  useAuth,
};