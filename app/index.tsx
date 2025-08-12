import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthContext } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const ONBOARDING_KEY = 'hasSeenOnboarding';

// Helper function to reset onboarding
const resetOnboarding = async () => {
  try {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    console.log('Onboarding has been reset');
    return true;
  } catch (error) {
    console.error('Error resetting onboarding:', error);
    return false;
  }
};

export default function IndexScreen() {
  const { isLoading, isAuthenticated } = useAuthContext();


  useEffect(() => {
    const handleInitialNavigation = async () => {
      console.log('Initial navigation started');
      
      // If we're still loading auth state, do nothing
      if (isLoading) {
        console.log('Auth state is still loading...');
        return;
      }

      // If user is authenticated, redirect to tabs
      if (isAuthenticated) {
        console.log('User is authenticated, redirecting to tabs');
        router.replace('/(tabs)');
        return;
      }

      // Check if user has seen onboarding
      try {
        console.log('Checking onboarding status...');
        const hasSeenOnboarding = await AsyncStorage.getItem(ONBOARDING_KEY);
        console.log('Onboarding status:', hasSeenOnboarding);
        
        if (hasSeenOnboarding !== 'true') {
          console.log('User has not seen onboarding, redirecting to onboarding');
          await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
          router.replace('/onboarding');
        } else {
          console.log('User has seen onboarding, redirecting to login');
          router.replace('/(auth)/login');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error in navigation:', errorMessage);
        // Default to login if there's an error
        router.replace('/(auth)/login');
      }
    };

    // Reset onboarding for testing (remove in production)
    // resetOnboarding();
    
    handleInitialNavigation();
  }, [isLoading, isAuthenticated]);

  // In production, show nothing or a splash screen
  return null;
}

const styles = StyleSheet.create({

});