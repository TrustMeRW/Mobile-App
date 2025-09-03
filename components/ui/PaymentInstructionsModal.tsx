import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { Info, Phone, X, Copy, Check } from 'lucide-react-native';
import BottomSheet, { BottomSheetView, BottomSheetScrollView } from '@gorhom/bottom-sheet';

interface PaymentInstructionsModalProps {
  isVisible: boolean;
  onClose: () => void;
  amount: string;
  phoneNumber: string;
}

export const PaymentInstructionsModal: React.FC<PaymentInstructionsModalProps> = ({
  isVisible,
  onClose,
  amount,
  phoneNumber,
}) => {
  const { colors } = useTheme();

  // Bottom sheet snap points
  const snapPoints = useMemo(() => ['70%'], []);

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
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
              <Info color={colors.primary} size={24} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Payment Instructions</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X color={colors.textSecondary} size={20} />
          </TouchableOpacity>
        </View>

        <BottomSheetScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
        >
          {/* Payment Info */}
          <View style={styles.paymentInfoSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Details</Text>
            
            <View style={[styles.paymentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.paymentRow}>
                <Text style={[styles.paymentLabel, { color: colors.textSecondary }]}>Amount:</Text>
                <Text style={[styles.paymentValue, { color: colors.text }]}>RWF {amount}</Text>
              </View>
              
              <View style={styles.paymentRow}>
                <Text style={[styles.paymentLabel, { color: colors.textSecondary }]}>Phone Number:</Text>
                <Text style={[styles.paymentValue, { color: colors.text }]}>{phoneNumber}</Text>
              </View>
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>How to Pay</Text>
            
            <View style={styles.instructionStep}>
              <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.textSecondary }]}>
                Open your mobile money app (MTN Mobile Money, Airtel Money, etc.)
              </Text>
            </View>

            <View style={styles.instructionStep}>
              <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.textSecondary }]}>
                Select "Send Money" or "Transfer"
              </Text>
            </View>

            <View style={styles.instructionStep}>
              <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.textSecondary }]}>
                Enter the phone number: {phoneNumber}
              </Text>
            </View>

            <View style={styles.instructionStep}>
              <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.textSecondary }]}>
                Enter the amount: RWF {amount}
              </Text>
            </View>

            <View style={styles.instructionStep}>
              <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepNumberText}>5</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.textSecondary }]}>
                Add a reference: "TrustME Subscription"
              </Text>
            </View>

            <View style={styles.instructionStep}>
              <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepNumberText}>6</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.textSecondary }]}>
                Confirm and complete the transaction
              </Text>
            </View>
          </View>

          {/* Important Notes */}
          <View style={styles.notesSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Important Notes</Text>
            
            <View style={[styles.noteCard, { backgroundColor: colors.warning + '10', borderColor: colors.warning + '30' }]}>
              <Info color={colors.warning} size={16} />
              <Text style={[styles.noteText, { color: colors.warning }]}>
                Please keep your transaction receipt for verification purposes.
              </Text>
            </View>

            <View style={[styles.noteCard, { backgroundColor: colors.info + '10', borderColor: colors.info + '30' }]}>
              <Phone color={colors.info} size={16} />
              <Text style={[styles.noteText, { color: colors.info }]}>
                Your subscription will be activated within 24 hours after payment confirmation.
              </Text>
            </View>
          </View>
        </BottomSheetScrollView>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Check color={colors.white} size={18} />
            <Text style={[styles.actionButtonText, { color: colors.white }]}>
              I Understand
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
    flex: 1,
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: 'DMSans-SemiBold',
    marginBottom: Spacing.md,
  },
  paymentInfoSection: {
    marginBottom: Spacing.xl,
  },
  paymentCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  paymentLabel: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Medium',
  },
  paymentValue: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-SemiBold',
  },
  instructionsSection: {
    marginBottom: Spacing.xl,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Bold',
    color: 'white',
  },
  stepText: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Regular',
    lineHeight: 20,
    flex: 1,
  },
  notesSection: {
    marginBottom: Spacing.lg,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  noteText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Regular',
    lineHeight: 18,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  actions: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    minHeight: 48,
    gap: Spacing.xs,
  },
  actionButtonText: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-SemiBold',
  },
});