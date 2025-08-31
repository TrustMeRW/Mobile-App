import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Typography, Spacing } from '@/constants/theme';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#080C1C" />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {/* Top Section - Gradient Background */}
          <LinearGradient
            colors={['#080C1C', '#253882']}
            style={styles.topSection}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            <View style={styles.logoContainer}>
              <Image
                source={require('@/assets/images/whitelogo.png')}
                style={styles.logo}
                contentFit="contain"
              />
            </View>
          </LinearGradient>

          {/* Bottom Section - White Content */}
          <View style={styles.bottomSection}>
            <View style={styles.whiteContentSection}>
              {children}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080C1C',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  topSection: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 120,
  },
  bottomSection: {
    flex: 1,
    backgroundColor: "#253882"
  },
  whiteContentSection: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: Spacing.xl,
    flex: 1,
    minHeight: 600, // Ensure minimum height for content
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
