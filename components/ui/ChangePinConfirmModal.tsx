import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { Shield, X, CheckCircle } from 'lucide-react-native';

interface ChangePinConfirmModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

const { height: screenHeight } = Dimensions.get('window');

export const ChangePinConfirmModal: React.FC<ChangePinConfirmModalProps> = ({
  isVisible,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const { colors } = useTheme();

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <View style={[styles.modal, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <View style={[styles.iconContainer, { backgroundColor: colors.warning + '15' }]}>
                <Shield color={colors.warning} size={24} />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>Confirm PIN/Password Change</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color={colors.textSecondary} size={20} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              Are you sure you want to change your PIN/Password? This action cannot be undone and you'll need to use your new PIN/Password for all future actions.
            </Text>
            
            <View style={styles.warningContainer}>
              <Text style={[styles.warningTitle, { color: colors.warning }]}>
                ⚠️ Important Notice
              </Text>
              <Text style={[styles.warningText, { color: colors.textSecondary }]}>
                • You'll need to remember your new PIN/Password
              </Text>
              <Text style={[styles.warningText, { color: colors.textSecondary }]}>
                • All existing sessions will remain active
              </Text>
              <Text style={[styles.warningText, { color: colors.textSecondary }]}>
                • This change takes effect immediately
              </Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={onClose}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: colors.warning }]}
              onPress={onConfirm}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              <CheckCircle color={colors.white} size={18} />
              <Text style={styles.confirmButtonText}>Change PIN/Password</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  modal: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingBottom: 40, // Safe area for bottom
    maxHeight: screenHeight * 0.6,
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
    marginBottom: Spacing.lg,
  },
  warningContainer: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.2)',
  },
  warningTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Bold',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  warningText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Regular',
    lineHeight: 20,
    marginBottom: Spacing.xs,
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
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  confirmButtonText: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-SemiBold',
    color: 'white',
  },
});
