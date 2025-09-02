import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { Info, Phone, X } from 'lucide-react-native';

interface PaymentInstructionsModalProps {
  isVisible: boolean;
  onClose: () => void;
  amount: string;
  phoneNumber: string;
}

const { height: screenHeight } = Dimensions.get('window');

export const PaymentInstructionsModal: React.FC<PaymentInstructionsModalProps> = ({
  isVisible,
  onClose,
  amount,
  phoneNumber,
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
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Info color={colors.primary} size={24} />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>Payment Instructions</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color={colors.textSecondary} size={20} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              You will shortly be prompted to pay RWF {amount} on your telephone number {phoneNumber}. If you do not get the prompt, you can use the following USSD codes:
            </Text>

            <View style={styles.ussdContainer}>
              <View style={[styles.ussdItem, { backgroundColor: colors.surface }]}>
                <Phone color={colors.success} size={16} />
                <Text style={[styles.ussdLabel, { color: colors.text }]}>MTN:</Text>
                <Text style={[styles.ussdCode, { backgroundColor: colors.success + '10', color: colors.success }]}>
                  *182*7*1#
                </Text>
              </View>
              <View style={[styles.ussdItem, { backgroundColor: colors.surface }]}>
                <Phone color={colors.info} size={16} />
                <Text style={[styles.ussdLabel, { color: colors.text }]}>Airtel:</Text>
                <Text style={[styles.ussdCode, { backgroundColor: colors.info + '10', color: colors.info }]}>
                  *182*6*1#
                </Text>
              </View>
            </View>
            
            <Text style={[styles.ussdInstructions, { color: colors.textSecondary }]}>
              Press the code for your network and follow the instructions to complete payment.
            </Text>

            <Text style={[styles.paymentInstructionsFooter, { color: colors.textSecondary }]}>
              Follow the prompts to complete your payment. Your subscription will be activated once payment is confirmed.
            </Text>
          </ScrollView>

          {/* Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.closeButtonStyle, { backgroundColor: colors.primary }]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.closeButtonText}>Got It</Text>
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
    maxHeight: screenHeight * 0.7,
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
  ussdContainer: {
    marginBottom: Spacing.lg,
  },
  ussdItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  ussdLabel: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Medium',
    marginLeft: Spacing.sm,
    marginRight: Spacing.md,
    minWidth: 50,
  },
  ussdCode: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Bold',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  ussdInstructions: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Regular',
    textAlign: 'center',
    marginBottom: Spacing.lg,
    fontStyle: 'italic',
  },
  paymentInstructionsFooter: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Regular',
    lineHeight: 22,
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  closeButtonStyle: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-SemiBold',
    color: 'white',
  },
});





