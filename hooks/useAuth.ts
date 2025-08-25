import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { User } from '@/types/api';
import Toast from 'react-native-toast-message';

const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const checkAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        if (token && isMounted) {
          // Verify token with profile endpoint
          const response = await fetch('http://192.168.1.77:4000/api/auth/profile', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok && isMounted) {
            const userData = await response.json();
            setUser(userData.payload.user);
            setIsAuthenticated(true);
          } else if (isMounted) {
            // Clear tokens without calling logout to avoid hook issues
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        if (isMounted) {
          // Clear tokens on error without calling logout
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (identifier: string, pin: string) => {
    try {
      console.log('Attempting login with:', { identifier, pin });
      const response = await fetch('http://192.168.1.77:4000/api/auth/login', {
      const response = await fetch('http://192.168.1.77:4000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ identifier, pin }),
      });

      console.log('Login response status:', response.status);
      const responseData = await response.json().catch(err => {
        console.error('Error parsing JSON response:', err);
        throw new Error('Invalid server response');
      });
      
      console.log('Login response data:', responseData);
      
      if (!response.ok) {
        // Handle error response
        const errorMessage = Array.isArray(responseData.message) 
          ? responseData.message.join(', ')
          : responseData.message || `Login failed with status ${response.status}`;
        
        throw new Error(errorMessage);
      }

      // Handle successful login
      if (!responseData.payload) {
        throw new Error('Invalid response format: missing payload');
      }

      const { accessToken, refreshToken, user } = responseData.payload;
      
      if (!accessToken) {
        throw new Error('No access token in response');
      }
      
      // Store tokens securely
      await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
      if (refreshToken) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      }
      
      // Update user state
      setUser(user || null);
      setIsAuthenticated(true);
      
      return { 
        success: true,
        message: responseData.message || 'Login successful',
        user
      };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      
      // Show error toast
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: errorMessage,
        visibilityTime: 4000,
      });
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const logout = async () => {
    try {
      // Clear tokens first
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      
      // Update state in a safe way
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if token deletion fails, ensure state is cleared
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const getToken = async () => {
    return await SecureStore.getItemAsync(TOKEN_KEY);
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