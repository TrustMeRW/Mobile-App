import { useQuery } from '@tanstack/react-query';
import { TokenStorage } from '@/utils/tokenStorage';
import { apiClient } from '@/services/api';
import { useEffect, useState, useCallback, useRef } from 'react';
import type { ProfileResponse, User } from '@/services/api';

export const useCurrentUser = () => {
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const [isProfileFetching, setIsProfileFetching] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const tokenChecked = useRef(false);

  // Check if token exists and update state
  const checkToken = useCallback(async () => {
    try {
      console.log('useCurrentUser: Checking token...');
      const token = await TokenStorage.getAccessToken();
      const tokenExists = !!token;
      console.log('useCurrentUser: Token exists:', tokenExists);
      
      setHasToken(tokenExists);
      return tokenExists;
    } catch (error) {
      console.error('useCurrentUser: Error checking token:', error);
      setHasToken(false);
      return false;
    }
  }, []);

  // Check if token exists (only once on mount)
  useEffect(() => {
    if (tokenChecked.current) return;
    
    const initializeTokenCheck = async () => {
      await checkToken();
      tokenChecked.current = true;
      setIsInitialized(true);
    };
    
    initializeTokenCheck();
  }, [checkToken]);

  // Listen for token changes (e.g., after login)
  useEffect(() => {
    const handleTokenChange = async () => {
      if (tokenChecked.current && isInitialized) {
        const tokenExists = await checkToken();
        // If we just got a token and don't have user data, trigger a profile fetch
        if (tokenExists && !user && !isLoading) {
          console.log('useCurrentUser: Token detected, triggering profile fetch');
          setIsProfileFetching(true);
          refetch();
        }
      }
    };

    // Check token when component updates (e.g., after login)
    handleTokenChange();
  }, [checkToken, user, refetch, isInitialized, isLoading]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      console.log('useCurrentUser: Fetching user profile...');
      setIsProfileFetching(true);
      try {
        const token = await TokenStorage.getAccessToken();
        if (!token) {
          throw new Error('No access token found');
        }
        
        const response = await apiClient.getUserProfile();
        console.log('useCurrentUser: Profile fetched successfully');
        return response.payload;
      } finally {
        setIsProfileFetching(false);
      }
    },
    enabled: hasToken === true, // Only fetch when we know there's a token
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: 1000,
  });

  // Extract user data from the profile response
  const user: User | undefined = data?.user;
  const subscriptionData = data ? {
    currentSubscription: data.currentSubscription,
    subscriptionDetails: data.subscriptionDetails,
    subscriptionFeatures: data.subscriptionFeatures,
    subscriptionStatus: data.subscriptionStatus,
    subscriptionSummary: data.subscriptionSummary,
  } : undefined;

  // Check if user is authenticated
  const isAuthenticated = !!user && hasToken === true;

  // Function to manually fetch user data
  const fetchUser = useCallback(async () => {
    try {
      console.log('useCurrentUser: Manual fetch triggered');
      // First check if we have a token
      const tokenExists = await checkToken();
      if (tokenExists) {
        setIsProfileFetching(true);
        await refetch();
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsProfileFetching(false);
    }
  }, [refetch, checkToken]);

  // Determine loading state - for CustomSplashScreen, we want to show loading during auth check
  const isTokenChecking = hasToken === null && !isInitialized;
  const isUserLoading = (isLoading && !isInitialized) || isTokenChecking;

  console.log('useCurrentUser: State update:', { 
    hasToken, 
    isTokenChecking, 
    isLoading, 
    isProfileFetching,
    isInitialized,
    isUserLoading, 
    isAuthenticated, 
    hasUser: !!user,
    hasSubscriptionData: !!subscriptionData
  });

  return {
    user,
    subscriptionData,
    isLoading: isUserLoading,
    isAuthenticated,
    error,
    refetch: fetchUser,
    checkToken, // Expose this for external use
  };
};

export default useCurrentUser;
