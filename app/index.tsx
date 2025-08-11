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
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    const handleInitialNavigation = async () => {
      console.log('Initial navigation started');
      
      // If we're still loading auth state, do nothing
      if (isLoading) {
        console.log('Auth state is still loading...');
        return;
      }

      // Debug info
      const debugData = {
        isLoading,
        isAuthenticated,
        timestamp: new Date().toISOString()
      };
      setDebugInfo(JSON.stringify(debugData, null, 2));
      console.log('Auth state:', debugData);

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

  // For debugging - shows the current auth state
  if (__DEV__) {
    return (
      <View style={styles.debugContainer}>
        <Text style={styles.debugText}>Auth State Debug:</Text>
        <Text style={styles.debugText}>Loading: {isLoading ? 'Yes' : 'No'}</Text>
        <Text style={styles.debugText}>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</Text>
        <Text style={styles.debugText}>
          Onboarding seen: {AsyncStorage.getItem(ONBOARDING_KEY).then(val => val || 'No')}
        </Text>
        <Text style={styles.debugText}>{debugInfo}</Text>
      </View>
    );
  }

  // In production, show nothing or a splash screen
  return null;
}

const styles = StyleSheet.create({
  debugContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  debugText: {
    fontSize: 14,
    marginBottom: 8,
    color: '#333',
  },
});