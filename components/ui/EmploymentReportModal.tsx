import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/contexts/TranslationContext';
import { useToast } from '@/contexts/ToastContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Typography, Spacing } from '@/constants/theme';
import { 
  XCircle, 
  AlertTriangle, 
  DollarSign, 
  Shield, 
  UserX, 
  Clock,
  FileText
} from 'lucide-react-native';
import { apiClient } from '@/services/api';
import BottomSheet, { BottomSheetView, BottomSheetScrollView } from '@gorhom/bottom-sheet';

interface EmploymentReportModalProps {
  visible: boolean;
  onClose: () => void;
  employmentId: string;
  userRole: 'employee' | 'employer';
  paymentId?: string; // Optional payment ID for reporting on specific payments
  onReportSubmitted?: () => void;
}

type ReportType = 'PAYMENT_ISSUES' | 'NOT_FOLLOWING_JOB_LAWS' | 'STEALING' | 'MISSING';

interface ReportTypeOption {
  type: ReportType;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
}

const EmploymentReportModal: React.FC<EmploymentReportModalProps> = ({
  visible,
  onClose,
  employmentId,
  userRole,
  paymentId,
  onReportSubmitted,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();
  const styles = getStyles(colors);

  const [selectedReportType, setSelectedReportType] = useState<ReportType | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bottom sheet snap points
  const snapPoints = useMemo(() => ['90%'], []);

  // Define available report types based on user role
  const getAvailableReportTypes = (): ReportTypeOption[] => {
    if (userRole === 'employee') {
      return [
        {
          type: 'PAYMENT_ISSUES',
          label: 'Payment Issues',
          description: 'Report issues with payment or salary',
          icon: DollarSign,
          color: colors.warning,
        },
      ];
    } else {
      return [
        {
          type: 'NOT_FOLLOWING_JOB_LAWS',
          label: 'Not Following Job Laws',
          description: 'Report violations of employment laws or regulations',
          icon: Shield,
          color: colors.error,
        },
        {
          type: 'STEALING',
          label: 'Stealing',
          description: 'Report theft or unauthorized taking of property',
          icon: UserX,
          color: colors.error,
        },
        {
          type: 'MISSING',
          label: 'Missing',
          description: 'Report employee absence or not showing up for work',
          icon: Clock,
          color: colors.warning,
        },
      ];
    }
  };

  const reportTypes = getAvailableReportTypes();

  const handleSubmit = async () => {
    if (!selectedReportType) {
      showError('Error', 'Please select a report type');
      return;
    }

    if (!description.trim()) {
      showError('Error', 'Please provide a description');
      return;
    }

    if (description.trim().length < 10) {
      showError('Error', 'Description must be at least 10 characters long');
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.createEmploymentReport(employmentId, {
        type: selectedReportType,
        description: description.trim(),
      });

      showSuccess('Success', 'Report submitted successfully');
      handleClose();
      onReportSubmitted?.();
    } catch (error: any) {
      showError('Error', error.response?.data?.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReportType(null);
    setDescription('');
    setIsSubmitting(false);
    onClose();
  };

  const renderReportTypeOption = (option: ReportTypeOption) => {
    const IconComponent = option.icon;
    const isSelected = selectedReportType === option.type;

    return (
      <TouchableOpacity
        key={option.type}
        style={[
          styles.reportTypeOption,
          isSelected && styles.reportTypeOptionSelected,
          { borderColor: isSelected ? option.color : colors.border }
        ]}
        onPress={() => setSelectedReportType(option.type)}
        activeOpacity={0.7}
      >
        <View style={styles.reportTypeHeader}>
          <View style={[styles.reportTypeIcon, { backgroundColor: option.color + '15' }]}>
            <IconComponent color={option.color} size={20} />
          </View>
          <View style={styles.reportTypeContent}>
            <Text style={[styles.reportTypeLabel, { color: isSelected ? option.color : colors.text }]}>
              {option.label}
            </Text>
            <Text style={styles.reportTypeDescription}>
              {option.description}
            </Text>
          </View>
          <View style={[
            styles.radioButton,
            { borderColor: isSelected ? option.color : colors.border }
          ]}>
            {isSelected && (
              <View style={[styles.radioButtonInner, { backgroundColor: option.color }]} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (!visible) return null;

  return (
    <BottomSheet
      index={0}
      snapPoints={snapPoints}
      onClose={handleClose}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: colors.card }}
      handleIndicatorStyle={{ backgroundColor: colors.border }}
    >
      <BottomSheetView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <AlertTriangle color={colors.warning} size={24} />
            <Text style={styles.title}>Report Employment Issue</Text>
          </View>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeButton}
            disabled={isSubmitting}
          >
            <XCircle color={colors.textSecondary} size={24} />
          </TouchableOpacity>
        </View>

        <BottomSheetScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Report Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Report Type</Text>
            <Text style={styles.sectionDescription}>
              {userRole === 'employee' 
                ? 'Choose the type of issue you want to report'
                : 'Choose the type of issue you want to report about the employee'
              }
            </Text>
            
            <View style={styles.reportTypesContainer}>
              {reportTypes.map(renderReportTypeOption)}
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.sectionDescription}>
              Provide detailed information about the issue
            </Text>
            
            <View style={styles.descriptionContainer}>
              <TextInput
                style={styles.descriptionInput}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe the issue in detail..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={styles.characterCount}>
                {description.length}/500 characters
              </Text>
            </View>
          </View>

          {/* Warning */}
          <View style={styles.warningContainer}>
            <AlertTriangle color={colors.warning} size={16} />
            <Text style={styles.warningText}>
              The report must be first reviewed by TrustME Admins for authenticity.
            </Text>
          </View>
        </BottomSheetScrollView>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={handleClose}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionButtonText, { color: colors.textSecondary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.actionButton, 
              styles.submitButton,
              (!selectedReportType || !description.trim() || isSubmitting) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!selectedReportType || !description.trim() || isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <LoadingSpinner size="small" color={colors.white} />
            ) : (
              <>
                <FileText color={colors.white} size={16} />
                <Text style={[styles.actionButtonText, { color: colors.white }]}>
                  Submit Report
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

export default EmploymentReportModal;

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontFamily: 'DMSans-Bold',
    color: colors.text,
    marginLeft: Spacing.sm,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-SemiBold',
    color: colors.text,
    marginBottom: Spacing.xs,
  },
  sectionDescription: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  reportTypesContainer: {
    gap: Spacing.sm,
  },
  reportTypeOption: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.md,
    backgroundColor: colors.card,
  },
  reportTypeOptionSelected: {
    backgroundColor: colors.surface,
  },
  reportTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  reportTypeContent: {
    flex: 1,
  },
  reportTypeLabel: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-SemiBold',
    marginBottom: Spacing.xs,
  },
  reportTypeDescription: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    lineHeight: 18,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  descriptionContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: Spacing.md,
  },
  descriptionInput: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Regular',
    color: colors.text,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: Typography.fontSize.xs,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.warning + '10',
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  warningText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.warning,
    marginLeft: Spacing.sm,
    flex: 1,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    marginBottom: Spacing.xxl,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: 12,
    minHeight: 48,
    gap: Spacing.xs,
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  submitButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-SemiBold',
  },
});