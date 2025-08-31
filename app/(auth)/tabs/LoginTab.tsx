import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTheme } from '@/contexts/ThemeContext';
import { Typography, Spacing } from '@/constants/theme';
import { MotiView } from 'moti';
import { Eye, EyeOff, User as UserIcon, Lock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLogin } from '@/hooks';
import { useTranslation } from '@/contexts/TranslationContext';

interface LoginTabProps {
  onSwitchTab: (tab: 'login' | 'register' | 'forgot-password') => void;
}

export default function LoginTab({ onSwitchTab }: LoginTabProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = getStyles(colors);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLogin();

  const handleLogin = async () => {
    if (!identifier?.trim() || !password) {
      return;
    }

    loginMutation.mutate({
      identifier: identifier.trim(),
      password,
    });
  };

  // Handle successful login
  React.useEffect(() => {
    if (loginMutation.isSuccess && loginMutation.data?.success) {
      // Navigate to main app after successful login
      console.log('Login successful, navigating to tabs');
      router.replace('/(tabs)');
    }
  }, [loginMutation.isSuccess, loginMutation.data, router]);

  if (loginMutation.isPending) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 500 }}
      style={styles.content}
    >
      <View style={styles.header}>
        <Text style={styles.welcomeText}>{t('auth.login.title')}</Text>
        <Text style={styles.subtitle}>
          {t('auth.login.subtitle')}
        </Text>
      </View>

      <View style={styles.form}>
        {/* Identifier Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{t('auth.login.identifier')}</Text>
          <View style={styles.inputWrapper}>
            <UserIcon size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              value={identifier}
              onChangeText={setIdentifier}
              placeholder={t('auth.login.identifier')}
              placeholderTextColor="#9ca3af"
              keyboardType="default"
              autoCapitalize="none"
              autoComplete="username"
              textContentType="username"
              returnKeyType="next"
              style={styles.input}
              editable={true}
              selectTextOnFocus={true}
              blurOnSubmit={false}
            />
          </View>
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{t('auth.login.password')}</Text>
          <View style={styles.inputWrapper}>
            <Lock size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.login.password')}
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password"
              textContentType="password"
              returnKeyType="done"
              style={styles.input}
              editable={true}
              selectTextOnFocus={true}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              {showPassword ? (
                <EyeOff size={20} color={colors.textSecondary} />
              ) : (
                <Eye size={20} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Forgot Password */}
        <TouchableOpacity 
          style={styles.forgotPasswordContainer}
          onPress={() => onSwitchTab('forgot-password')}
        >
          <Text style={styles.forgotPassword}>{t('auth.login.forgotPassword')}</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <LinearGradient
          colors={['#080C1C', '#253882']}
          style={styles.loginButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
                      <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <LoadingSpinner size="small" color="#ffffff" />
              ) : (
                <Text style={styles.loginButtonText}>{t('auth.login.loginButton')}</Text>
              )}
            </TouchableOpacity>
        </LinearGradient>

                  {/* Create Account */}
          <View style={styles.createAccountContainer}>
            <Text style={styles.createAccountText}>
              {t('auth.login.createAccount')}{' '}
              <Text
                style={styles.createAccountLink}
                onPress={() => onSwitchTab('register')}
              >
                {t('auth.login.createAccountLink')}
              </Text>
            </Text>
          </View>
      </View>
    </MotiView>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
    },
    header: {
      alignItems: 'flex-start',
      marginBottom: Spacing.md,
    },
    welcomeText: {
      fontSize: Typography.fontSize.xxxl,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    subtitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
    },
    form: {
      flex: 1,
    },
    inputContainer: {
      marginBottom: Spacing.lg,
      width: '100%',
    },
    inputLabel: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: Spacing.md,
      width: '100%',
      minHeight: 52,
    },
    inputIcon: {
      marginRight: Spacing.sm,
    },
    input: {
      flex: 1,
      fontSize: Typography.fontSize.md,
      color: colors.text,
      paddingVertical: 12,
    },
    eyeIcon: {
      padding: Spacing.xs,
    },
    forgotPasswordContainer: {
      alignSelf: 'flex-end',
      marginBottom: Spacing.lg,
    },
    forgotPassword: {
      fontSize: Typography.fontSize.md,
      color: colors.primary,
      fontFamily: 'DMSans-Medium',
      textDecorationLine: 'underline',
    },
    loginButtonGradient: {
      marginBottom: Spacing.lg,
      borderRadius: 12,
      overflow: 'hidden',
    },
    loginButton: {
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 56,
    },
    loginButtonText: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-Bold',
      color: '#ffffff',
      textAlign: 'center',
    },
    createAccountContainer: {
      alignItems: 'center',
      marginTop: Spacing.md,
    },
    createAccountText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    createAccountLink: {
      color: colors.primary,
      fontFamily: 'DMSans-Bold',
      textDecorationLine: 'underline',
    },
  });
