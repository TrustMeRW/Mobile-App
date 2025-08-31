import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useCurrentUser } from '@/hooks';

export default function CustomSplashScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useCurrentUser();
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const [showDelay, setShowDelay] = useState(false);
  const hasNavigated = useRef(false);

  // Check authentication when component mounts
  useEffect(() => {
    if (!isLoading && !hasNavigated.current) {
      console.log('CustomSplashScreen: Auth check complete, isAuthenticated:', isAuthenticated);
      setAuthCheckComplete(true);
      
      // Wait 1 second after auth check before navigating
      const delayTimer = setTimeout(() => {
        setShowDelay(true);
      }, 1000);

      return () => clearTimeout(delayTimer);
    }
  }, [isLoading, isAuthenticated]);

  // Navigate after the 1-second delay
  useEffect(() => {
    if (authCheckComplete && showDelay && !hasNavigated.current) {
      console.log('CustomSplashScreen: Delay complete, navigating...');
      
      if (isAuthenticated) {
        console.log('CustomSplashScreen: User authenticated, navigating to tabs');
        router.replace('/(tabs)');
      } else {
        console.log('CustomSplashScreen: User not authenticated, navigating to auth');
        router.replace('/(auth)');
      }
      hasNavigated.current = true;
    }
  }, [authCheckComplete, showDelay, isAuthenticated, router]);

  // Prevent any further navigation attempts once we've navigated
  if (hasNavigated.current) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/whitelogo.png')}
        style={styles.logo}
        contentFit="contain"
      />
      
      {/* Show loading spinner during authentication check */}
      {!authCheckComplete && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#ffffff" />
        </View>
      )}
      
      {/* Show "checking..." text during delay */}
      {authCheckComplete && !showDelay && (
        <View style={styles.loadingContainer}>
          <Text style={styles.checkingText}>Checking...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#080C1C', // Use hardcoded color instead of theme
  },
  logo: {
    width: 200,
    height: 200,
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  checkingText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'DMSans-Medium',
  },
});
