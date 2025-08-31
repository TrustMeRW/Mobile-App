import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { MotiView } from 'moti';
import { Typography, Spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { AlertCircle, Package, CreditCard, User, Bell } from 'lucide-react-native';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'default',
  title,
  message,
  actionText,
  onAction,
  style,
}) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertCircle size={48} color={colors.error} />;
      case 'package':
        return <Package size={48} color={colors.warning} />;
      case 'payment':
        return <CreditCard size={48} color={colors.info} />;
      case 'user':
        return <User size={48} color={colors.primary} />;
      case 'notification':
        return <Bell size={48} color={colors.textSecondary} />;
      default:
        return <AlertCircle size={48} color={colors.textSecondary} />;
    }
  };

  return (
    <View style={[styles.container, style]}>
      {getIcon()}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionText && onAction && (
        <Button
          title={actionText}
          onPress={onAction}
          variant="primary"
          style={styles.actionButton}
        />
      )}
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontFamily: 'DMSans-Bold',
    color: colors.text,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    minWidth: 120,
  },
});