import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { CheckCircle, X } from 'lucide-react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

interface ConfirmationModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  icon?: React.ReactNode;
  iconColor?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isVisible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  icon,
  iconColor,
}) => {
  const { colors } = useTheme();

  // Bottom sheet snap points
  const snapPoints = useMemo(() => ['40%'], []);

  if (!isVisible) return null;

  return (
    <BottomSheet
      index={0}
      snapPoints={snapPoints}
      onClose={onClose}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: colors.card }}
      handleIndicatorStyle={{ backgroundColor: colors.border }}
    >
      <BottomSheetView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            {icon && (
              <View style={[styles.iconContainer, { backgroundColor: (iconColor || colors.primary) + '15' }]}>
                {icon}
              </View>
            )}
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X color={colors.textSecondary} size={20} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {message}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton, { borderColor: colors.border }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionButtonText, { color: colors.textSecondary }]}>
              {cancelText}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.confirmButton, { backgroundColor: colors.primary }]}
            onPress={onConfirm}
            activeOpacity={0.8}
          >
            <CheckCircle color={colors.white} size={18} />
            <Text style={[styles.actionButtonText, { color: colors.white }]}>
              {confirmText}
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontFamily: 'DMSans-Bold',
  },
  closeButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  message: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Regular',
    lineHeight: 24,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    minHeight: 48,
    gap: Spacing.xs,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  confirmButton: {
    // backgroundColor set dynamically
  },
  actionButtonText: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-SemiBold',
  },
});