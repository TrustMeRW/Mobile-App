import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthContext } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTheme } from '@/contexts/ThemeContext';
import { Typography, Spacing } from '@/constants/theme';
import Toast from 'react-native-toast-message';
import { MotiView } from 'moti';
import { Eye, EyeOff } from 'lucide-react-native';

export default function LoginScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
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
      console.log('Calling login function with:', {
        identifier: identifier.trim(),
        pin: '***',
      });
      const result = await login(identifier.trim(), pin);
      console.log('Login result:', {
        success: result.success,
        hasError: !!result.error,
      });

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
        text2:
          error instanceof Error
            ? error.message
            : 'Something went wrong. Please try again.',
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
            <Text style={styles.subtitle}>
              Sign in to continue managing your debts
            </Text>
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
            <View style={{ position: 'relative' }}>
              <Input
                label="PIN"
                value={pin}
                onChangeText={setPin}
                secureTextEntry={!showPin}
                keyboardType="numeric"
                maxLength={6}
                required
                style={{ paddingRight: 40 }}
              />
              <TouchableOpacity
                onPress={() => setShowPin((prev) => !prev)}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 32,
                  padding: 8,
                  zIndex: 10,
                }}
                activeOpacity={0.7}
              >
                {showPin ? (
                  <EyeOff size={20} color={colors.gray[500]} />
                ) : (
                  <Eye size={20} color={colors.gray[500]} />
                )}
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
            >
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

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
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
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    subtitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    form: {
      marginBottom: Spacing.xl,
    },
    forgotPassword: {
      fontSize: Typography.fontSize.sm,
      color: colors.primary,
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
      color: colors.textSecondary,
      fontFamily: 'DMSans-Regular',
    },
    signupLink: {
      color: colors.primary,
      fontFamily: 'DMSans-SemiBold',
    },
  });
