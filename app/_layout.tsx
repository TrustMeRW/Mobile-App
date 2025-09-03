import { useEffect, useState } from 'react';
import { LogBox } from 'react-native';
// Suppress all log notifications and error popups in Expo Go
LogBox.ignoreAllLogs(true);
console.error = () => {};
console.warn = () => {};
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingScreen from './onboarding';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { TranslationProvider } from '@/contexts/TranslationContext';
import CustomSplashScreen from '@/components/CustomSplashScreen';
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import * as SplashScreen from 'expo-splash-screen';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NotificationProvider } from '@/services/notifications';
import UpdateManager from '@/components/UpdateManager';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function RootLayout() {
  useFrameworkReady();
  const [fontsLoaded, fontError] = useFonts({
    'DMSans-Regular': DMSans_400Regular,
    'DMSans-Medium': DMSans_500Medium,
    'DMSans-SemiBold': DMSans_600SemiBold,
    'DMSans-Bold': DMSans_700Bold,
  });
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const seen = await AsyncStorage.getItem('hasSeenOnboarding');
        if (!seen) {
          setShowOnboarding(true);
        }
        setOnboardingChecked(true);
      } catch (error) {
        console.error('Error checking onboarding:', error);
        setOnboardingChecked(true); // Continue even if there's an error
      }
    }
    
    if (fontsLoaded || fontError) {
      checkOnboarding();
    }
  }, [fontsLoaded, fontError]);

  // Hide native splash screen after fonts are loaded and onboarding is checked
  useEffect(() => {
    if (onboardingChecked && (fontsLoaded || fontError)) {
      console.log('Hiding native splash screen');
      SplashScreen.hideAsync().catch(console.error);
    }
  }, [onboardingChecked, fontsLoaded, fontError]);

  // Debug logging
  console.log('Layout state:', { fontsLoaded, fontError, onboardingChecked, showOnboarding });

  // Show loading state while fonts are loading or onboarding is being checked
  if ((!fontsLoaded && !fontError) || !onboardingChecked) {
    console.log('Showing loading state');
    return null; // Return null to let native splash screen handle loading
  }

  if (showOnboarding) {
    console.log('Showing onboarding screen');
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <TranslationProvider>
              <OnboardingScreen />
            </TranslationProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    );
  }

  console.log('Showing main app');
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TranslationProvider>
            <NotificationProvider>
              <ToastProvider>
                <View style={{ flex: 1 }}>
                  {/* <UpdateManager /> */}
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen
                      name="(tabs)"
                      options={{
                        headerRight: () => null,
                      }}
                    />
                    <Stack.Screen name="onboarding" />
                    <Stack.Screen
                      name="notifications"
                      options={{
                        headerShown: true,
                        title: 'Notifications',
                        headerBackTitle: 'Back',
                      }}
                    />
                    <Stack.Screen name="+not-found" />
                  </Stack>
                </View>
                <StatusBar style="auto" />
              </ToastProvider>
            </NotificationProvider>
          </TranslationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
