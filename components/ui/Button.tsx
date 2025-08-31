import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { Typography, Spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors, variant, size);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? '#ffffff' : colors.primary}
        />
      ) : (
        <Text style={[styles.text, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const getStyles = (colors: any, variant: string, size: string) => StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...(variant === 'primary' && {
      backgroundColor: colors.primary,
    }),
    ...(variant === 'secondary' && {
      backgroundColor: colors.gray[100],
    }),
    ...(variant === 'outline' && {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.primary,
    }),
    ...(variant === 'ghost' && {
      backgroundColor: 'transparent',
    }),
    ...(size === 'small' && {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      minHeight: 36,
    }),
    ...(size === 'medium' && {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      minHeight: 48,
    }),
    ...(size === 'large' && {
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.lg,
      minHeight: 56,
    }),
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontFamily: 'DMSans-Medium',
    textAlign: 'center',
    ...(variant === 'primary' && {
      color: '#ffffff',
    }),
    ...(variant === 'secondary' && {
      color: '#343a40',
    }),
    ...(variant === 'outline' && {
      color: colors.primary,
    }),
    ...(variant === 'ghost' && {
      color: colors.primary,
    }),
    ...(size === 'small' && {
      fontSize: Typography.fontSize.sm,
    }),
    ...(size === 'medium' && {
      fontSize: Typography.fontSize.md,
    }),
    ...(size === 'large' && {
      fontSize: Typography.fontSize.lg,
    }),
  },
});