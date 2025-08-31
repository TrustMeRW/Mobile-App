import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import {
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
  editable = true,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: editable ? colors.card : colors.background,
            borderColor: isFocused ? colors.primary : colors.border,
            color: editable ? colors.text : colors.textSecondary,
          },
          isFocused && editable && styles.inputFocused,
          error && styles.inputError,
          !editable && styles.inputDisabled,
          style,
        ]}
        onFocus={() => editable && setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholderTextColor={colors.textSecondary}
        editable={editable}
        selectTextOnFocus={editable}
        blurOnSubmit={false}
        {...props}
      />
      {error && (
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error}
        </Text>
      )}
      {helperText && !error && (
        <Text
          style={[styles.helperText, { color: colors.textSecondary }]}
        >
          {helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Medium',
    marginBottom: Spacing.xs,
  },
  required: {
    color: '#ef4444', // Error color
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Regular',
    minHeight: 48,
  },
  inputFocused: {
    borderWidth: 2,
  },
  inputError: {
    // Error styling handled by theme colors
  },
  inputDisabled: {
    opacity: 0.6,
  },
  errorText: {
    fontSize: Typography.fontSize.xs,
    marginTop: Spacing.xs,
    fontFamily: 'DMSans-Regular',
  },
  helperText: {
    fontSize: Typography.fontSize.xs,
    marginTop: Spacing.xs,
    fontFamily: 'DMSans-Regular',
  },
});
