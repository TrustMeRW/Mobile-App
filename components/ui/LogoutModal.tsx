import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { LogOut, X } from 'lucide-react-native';
import { useTranslation } from '@/contexts/TranslationContext';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

interface LogoutModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({
  isVisible,
  onClose,
  onConfirm,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = getStyles(colors);

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
            <View style={[styles.iconContainer, { backgroundColor: colors.error + '15' }]}>
              <LogOut color={colors.error} size={24} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Sign Out</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X color={colors.textSecondary} size={20} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            Are you sure you want to sign out of your account? You'll need to sign in again to access your data.
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: colors.error }]}
            onPress={onConfirm}
            activeOpacity={0.8}
          >
            <LogOut color={colors.white} size={18} />
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
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
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-SemiBold',
  },
  logoutButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  logoutButtonText: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-SemiBold',
    color: 'white',
  },
});