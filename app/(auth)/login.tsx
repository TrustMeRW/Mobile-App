import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthContext } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Colors, Typography, Spacing } from '@/constants/theme';
import Toast from 'react-native-toast-message';
import { MotiView } from 'moti';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isLoading } = useAuthContext();

  const handleLogin = async () => {
    if (!identifier?.trim() || !pin) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please enter both your identifier and PIN',
        visibilityTime: 3000,
      });
      return;
    }

    console.log('Starting login process...');
    setLoading(true);
    
    try {
      console.log('Calling login function with:', { identifier: identifier.trim(), pin: '***' });
      const result = await login(identifier.trim(), pin);
      console.log('Login result:', { success: result.success, hasError: !!result.error });
      
      if (result.success) {
        console.log('Login successful, navigating to app...');
        Toast.show({
          type: 'success',
          text1: 'Welcome!',
          text2: 'You have successfully logged in',
          visibilityTime: 2000,
        });
        router.replace('/(tabs)');
      } else {
        console.error('Login failed:', result.error);
        // Error toast is already shown in the useAuth hook
      }
    } catch (error) {
      console.error('Unexpected login error:', error);
      Toast.show({
        type: 'error',
        text1: 'Login Error',
        text2: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        visibilityTime: 5000,
        onPress: () => Toast.hide(),
      });
    } finally {
      console.log('Login process completed');
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <MotiView
          from={{ opacity: 0, translateY: 50 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
          style={styles.content}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue managing your debts</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email or Phone"
              value={identifier}
              onChangeText={setIdentifier}
              keyboardType="default"
              autoCapitalize="none"
              autoComplete="username"
              textContentType="username"
              returnKeyType="next"
              required
            />
            
            <Input
              label="PIN"
              value={pin}
              onChangeText={setPin}
              secureTextEntry
              keyboardType="numeric"
              maxLength={6}
              required
            />

            <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
              <Text style={styles.forgotPassword}>Forgot PIN?</Text>
            </TouchableOpacity>

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.signupText}>
              Don't have an account?{' '}
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </Text>
          </View>
        </MotiView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  title: {
    fontSize: Typography.fontSize.xxxl,
    fontFamily: 'DMSans-Bold',
    color: Colors.dark,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Regular',
    color: Colors.gray[600],
    textAlign: 'center',
  },
  form: {
    marginBottom: Spacing.xl,
  },
  forgotPassword: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontFamily: 'DMSans-Medium',
    textAlign: 'right',
    marginBottom: Spacing.lg,
  },
  loginButton: {
    marginTop: Spacing.md,
  },
  footer: {
    alignItems: 'center',
  },
  signupText: {
    fontSize: Typography.fontSize.md,
    color: Colors.gray[600],
    fontFamily: 'DMSans-Regular',
  },
  signupLink: {
    color: Colors.primary,
    fontFamily: 'DMSans-SemiBold',
  },
});