import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Typography, Spacing } from '@/constants/theme';
import { MotiView } from 'moti';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/contexts/TranslationContext';
import { useForgotPassword } from '@/hooks';

interface ForgotPasswordTabProps {
  onSwitchTab: (tab: 'login' | 'register' | 'forgot-password') => void;
}

export default function ForgotPasswordTab({ onSwitchTab }: ForgotPasswordTabProps) {
  const [email, setEmail] = useState('');
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = getStyles(colors);

  const forgotPasswordMutation = useForgotPassword();

  const handleSendReset = () => {
    if (!email) {
      return;
    }

    forgotPasswordMutation.mutate({ email });
  };

  // Handle successful password reset request
  React.useEffect(() => {
    if (forgotPasswordMutation.isSuccess && forgotPasswordMutation.data?.success) {
      // Switch to login tab after successful password reset request
      onSwitchTab('login');
    }
  }, [forgotPasswordMutation.isSuccess, forgotPasswordMutation.data, onSwitchTab]);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 500 }}
      style={styles.content}
    >
      <View style={styles.header}>
        <Text style={styles.title}>
          {t('auth.forgotPassword.title')}
        </Text>
      </View>

      <Text style={styles.subtitle}>
        {t('auth.forgotPassword.subtitle')}
      </Text>

      <Input
        label={t('auth.forgotPassword.email')}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        required
      />

      <Button
        title={t('auth.forgotPassword.sendResetLink')}
        onPress={handleSendReset}
        loading={forgotPasswordMutation.isPending}
        style={styles.button}
      />

      {/* Back to Login Link */}
      <View style={styles.backToLoginContainer}>
        <Text style={styles.backToLoginText}>
          {t('auth.forgotPassword.rememberPin')}{' '}
          <Text
            style={styles.backToLoginLink}
            onPress={() => onSwitchTab('login')}
          >
            {t('auth.forgotPassword.signIn')}
          </Text>
        </Text>
      </View>
    </MotiView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontFamily: 'DMSans-Bold',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 22,
    textAlign: 'center',
  },
  button: {
    marginTop: Spacing.lg,
  },
  backToLoginContainer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  backToLoginText: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  backToLoginLink: {
    color: colors.primary,
    fontFamily: 'DMSans-Bold',
    textDecorationLine: 'underline',
  },
});
