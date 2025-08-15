import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import {
  lightColors as Colors,
  Typography,
  BorderRadius,
  Spacing,
} from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  required,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const { theme, colors } = useTheme();
  const isDark = theme === 'dark';

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, isDark && { color: colors.text }]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          isDark && {
            backgroundColor: colors.card,
            borderColor: isFocused ? colors.primary : colors.border,
            color: colors.text,
          },
          isFocused && styles.inputFocused,
          error && styles.inputError,
          style,
        ]}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholderTextColor={isDark ? colors.textSecondary : Colors.gray[400]}
        {...props}
      />
      {error && (
        <Text style={[styles.errorText, isDark && { color: colors.error }]}>
          {error}
        </Text>
      )}
      {helperText && !error && (
        <Text
          style={[styles.helperText, isDark && { color: colors.textSecondary }]}
        >
          {helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Medium',
    color: Colors.dark,
    marginBottom: Spacing.xs,
  },
  required: {
    color: Colors.error,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Regular',
    backgroundColor: Colors.white,
    minHeight: 48,
  },
  inputFocused: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.error,
    marginTop: Spacing.xs,
    fontFamily: 'DMSans-Regular',
  },
  helperText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[500],
    marginTop: Spacing.xs,
    fontFamily: 'DMSans-Regular',
  },
});
