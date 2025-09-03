import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import EmploymentReportModal from '@/components/ui/EmploymentReportModal';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/contexts/TranslationContext';
import { useToast } from '@/contexts/ToastContext';
import { useCurrentUser } from '@/hooks';
import { 
  useEmployment,
  useApproveEmployment,
  useRejectEmployment,
  useResignEmployment,
  useConfirmResignation,
  useRejectResignation,
  useFinishEmployment,
  useConfirmFinish,
  useRejectFinish,
} from '@/hooks';
import { apiClient } from '@/services/api';
import { Typography, Spacing } from '@/constants/theme';
import { JobPayment, EmploymentReport } from '@/types/api';
import { MotiView } from 'moti';
import { 
  ChevronLeft,
  User as UserIcon,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  Briefcase,
  Phone,
  Mail,
  Building,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Eye,
  EyeOff,
  LogOut,
  CheckSquare,
  Square,
  Flag,
  Target,
  AlertTriangle,
  Receipt,
  UserX,
  FileText,
  CheckCircle2,
  Clock3
} from 'lucide-react-native';

export default function EmploymentDetailScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const styles = getStyles(colors);

  const { user: currentUser } = useCurrentUser();
  const { data: employment, isLoading, refetch } = useEmployment(id || '');

  // State for PIN input modal
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: string;
    title: string;
    description: string;
  } | null>(null);

  // State for report modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedPaymentForReport, setSelectedPaymentForReport] = useState<JobPayment | null>(null);

  // State for payment action modal
  const [showPaymentActionModal, setShowPaymentActionModal] = useState(false);
  const [selectedPaymentForAction, setSelectedPaymentForAction] = useState<JobPayment | null>(null);
  const [paymentActionType, setPaymentActionType] = useState<'pay' | 'confirm' | 'reject' | null>(null);

  // Bottom sheet refs
  const pinBottomSheetRef = useRef<BottomSheet>(null);
  const paymentActionBottomSheetRef = useRef<BottomSheet>(null);

  // Employment action hooks
  const approveEmploymentMutation = useApproveEmployment();
  const rejectEmploymentMutation = useRejectEmployment();
  const resignEmploymentMutation = useResignEmployment();
  const confirmResignationMutation = useConfirmResignation();
  const rejectResignationMutation = useRejectResignation();
  const finishEmploymentMutation = useFinishEmployment();
  const confirmFinishMutation = useConfirmFinish();
  const rejectFinishMutation = useRejectFinish();

  const handleRefresh = async () => {
    await refetch();
  };

  // Helper function to check if current user is the employee
  const isEmployee = () => {
    return currentUser && employment && currentUser.id === employment.employee.id;
  };

  // Helper function to check if current user is the employer
  const isEmployer = () => {
    return currentUser && employment && currentUser.id === employment.employer.id;
  };

  // Helper function to check if current user can perform action
  const canPerformAction = () => {
    return currentUser && employment && (isEmployee() || isEmployer());
  };

  // Helper function to get user role for reporting
  const getUserRole = (): 'employee' | 'employer' | null => {
    if (isEmployee()) return 'employee';
    if (isEmployer()) return 'employer';
    return null;
  };

  // Show report modal
  const showReportModalForEmployment = (payment?: JobPayment) => {
    setSelectedPaymentForReport(payment || null);
    setShowReportModal(true);
  };

  // Close report modal
  const closeReportModal = () => {
    setShowReportModal(false);
    setSelectedPaymentForReport(null);
  };

  // Handle report submission
  const handleReportSubmitted = () => {
    closeReportModal();
    // Optionally refresh the data
    refetch();
  };

  // Show payment action modal
  const showPaymentActionModalForPayment = (payment: JobPayment, actionType: 'pay' | 'confirm' | 'reject') => {
    setSelectedPaymentForAction(payment);
    setPaymentActionType(actionType);
    setShowPaymentActionModal(true);
    setPin('');
    setShowPin(false);
    paymentActionBottomSheetRef.current?.expand();
  };

  // Close payment action modal
  const closePaymentActionModal = () => {
    setShowPaymentActionModal(false);
    setSelectedPaymentForAction(null);
    setPaymentActionType(null);
    setPin('');
    paymentActionBottomSheetRef.current?.close();
  };

  // Execute payment action
  const executePaymentAction = async () => {
    if (!selectedPaymentForAction || !paymentActionType || !pin.trim()) {
      showError('Error', 'Please enter your PIN/Password');
      return;
    }

    if (pin.trim().length < 4) {
      showError('Error', 'PIN/Password must be at least 4 characters long');
      return;
    }

    try {
      let successMessage = '';

      switch (paymentActionType) {
        case 'pay':
          await apiClient.payJobPayment(selectedPaymentForAction.id, pin.trim());
          successMessage = 'Payment marked as paid successfully';
          break;
        case 'confirm':
          await apiClient.confirmJobPayment(selectedPaymentForAction.id, pin.trim());
          successMessage = 'Payment confirmed successfully';
          break;
        case 'reject':
          await apiClient.rejectJobPayment(selectedPaymentForAction.id, pin.trim());
          successMessage = 'Payment rejected successfully';
          break;
        default:
          throw new Error('Unknown payment action type');
      }

      showSuccess('Success', successMessage);
      closePaymentActionModal();
      refetch();
    } catch (error: any) {
      showError('Action Failed', error.response?.data?.message || error.message || 'Failed to perform payment action');
    }
  };

  // Show PIN modal for action
  const showPinModalForAction = (type: string, title: string, description: string) => {
    setPendingAction({ type, title, description });
    setShowPinModal(true);
    setPin('');
    setShowPin(false);
    pinBottomSheetRef.current?.expand();
  };

  // Execute the pending action
  const executeAction = async () => {
    if (!pendingAction || !employment || !pin.trim()) {
      showError('Error', 'Please enter your PIN/Password');
      return;
    }

    if (pin.trim().length < 4) {
      showError('Error', 'PIN/Password must be at least 4 characters long');
      return;
    }

    try {
      let mutation;
      let successMessage = '';

      switch (pendingAction.type) {
        case 'approve':
          mutation = approveEmploymentMutation;
          successMessage = 'Employment approved successfully';
          break;
        case 'reject':
          mutation = rejectEmploymentMutation;
          successMessage = 'Employment rejected successfully';
          break;
        case 'resign':
          mutation = resignEmploymentMutation;
          successMessage = 'Resignation initiated successfully';
          break;
        case 'confirm-resignation':
          mutation = confirmResignationMutation;
          successMessage = 'Resignation confirmed successfully';
          break;
        case 'reject-resignation':
          mutation = rejectResignationMutation;
          successMessage = 'Resignation rejected successfully';
          break;
        case 'finish':
          mutation = finishEmploymentMutation;
          successMessage = 'Job finished successfully';
          break;
        case 'confirm-finish':
          mutation = confirmFinishMutation;
          successMessage = 'Job finish confirmed successfully';
          break;
        case 'reject-finish':
          mutation = rejectFinishMutation;
          successMessage = 'Job finish rejected successfully';
          break;
        default:
          throw new Error('Unknown action type');
      }

      await mutation.mutateAsync({ id: employment.id, pin: pin.trim() });
      showSuccess('Success', successMessage);
      setShowPinModal(false);
      setPendingAction(null);
      setPin('');
      pinBottomSheetRef.current?.close();
    } catch (error: any) {
      showError('Action Failed', error.response?.data?.message || error.message || 'Failed to perform action');
    }
  };

  // Get available actions based on employment status and user role
  const getAvailableActions = () => {
    if (!employment || !canPerformAction()) return [];

    const actions = [];

    // PENDING status - only employee can approve/reject
    if (employment.status === 'PENDING' && isEmployee()) {
      actions.push({
        type: 'approve',
        title: 'Approve Employment',
        description: 'Accept this employment offer',
        icon: CheckCircle,
        color: colors.success,
        style: 'primary'
      });
      actions.push({
        type: 'reject',
        title: 'Reject Employment',
        description: 'Decline this employment offer',
        icon: XCircle,
        color: colors.error,
        style: 'secondary'
      });
    }

    // ACTIVE status - both can resign or finish
    if (employment.status === 'ACTIVE') {
      actions.push({
        type: 'resign',
        title: isEmployer() ? 'Terminate Employment' : 'Resign',
        description: isEmployer() 
          ? 'Terminate this employment contract' 
          : 'Initiate resignation from this employment',
        icon: isEmployer() ? UserX : LogOut,
        color: colors.warning,
        style: 'secondary'
      });
      actions.push({
        type: 'finish',
        title: 'Finish Job',
        description: 'Mark this job as completed',
        icon: Flag,
        color: colors.primary,
        style: 'primary'
      });
    }

    // PENDING resignation - other party can confirm/reject (not the one who initiated)
    if (employment.resignationStatus === 'PENDING_EMPLOYEE' && isEmployer() && employment.resignedBy !== currentUser?.id) {
      actions.push({
        type: 'confirm-resignation',
        title: 'Confirm Resignation',
        description: 'Confirm the resignation request',
        icon: CheckSquare,
        color: colors.success,
        style: 'primary'
      });
      actions.push({
        type: 'reject-resignation',
        title: 'Reject Resignation',
        description: 'Reject the resignation request',
        icon: Square,
        color: colors.error,
        style: 'secondary'
      });
    }

    if (employment.resignationStatus === 'PENDING_EMPLOYER' && isEmployee() && employment.resignedBy !== currentUser?.id) {
      actions.push({
        type: 'confirm-resignation',
        title: 'Confirm Resignation',
        description: 'Confirm the resignation request',
        icon: CheckSquare,
        color: colors.success,
        style: 'primary'
      });
      actions.push({
        type: 'reject-resignation',
        title: 'Reject Resignation',
        description: 'Reject the resignation request',
        icon: Square,
        color: colors.error,
        style: 'secondary'
      });
    }

    // PENDING finish - other party can confirm/reject (not the one who initiated)
    if (employment.status === 'PENDING_FINISH' && employment.finishedBy !== currentUser?.id) {
      // If employee initiated finish, employer can confirm/reject
      if (isEmployer()) {
        actions.push({
          type: 'confirm-finish',
          title: 'Confirm Finish',
          description: 'Confirm the job completion',
          icon: CheckSquare,
          color: colors.success,
          style: 'primary'
        });
        actions.push({
          type: 'reject-finish',
          title: 'Reject Finish',
          description: 'Reject the job completion',
          icon: Square,
          color: colors.error,
          style: 'secondary'
        });
      }
      // If employer initiated finish, employee can confirm/reject
      if (isEmployee()) {
        actions.push({
          type: 'confirm-finish',
          title: 'Confirm Finish',
          description: 'Confirm the job completion',
          icon: CheckSquare,
          color: colors.success,
          style: 'primary'
        });
        actions.push({
          type: 'reject-finish',
          title: 'Reject Finish',
          description: 'Reject the job completion',
          icon: Square,
          color: colors.error,
          style: 'secondary'
        });
      }
    }

    return actions;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return colors.success;
      case 'PENDING':
        return colors.warning;
      case 'RESIGNED':
        return colors.error;
      case 'TERMINATED':
        return colors.error;
      case 'CANCELLED':
        return colors.textSecondary;
      case 'PENDING_FINISH':
        return colors.info;
      case 'FINISHED':
        return colors.primary;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return CheckCircle;
      case 'PENDING':
        return Clock;
      case 'RESIGNED':
      case 'TERMINATED':
      case 'CANCELLED':
        return XCircle;
      case 'PENDING_FINISH':
        return AlertCircle;
      case 'FINISHED':
        return CheckCircle;
      default:
        return Info;
    }
  };

  const getPaymentTypeLabel = (paymentType: string) => {
    switch (paymentType) {
      case 'DAILY':
        return 'Daily';
      case 'WEEKLY':
        return 'Weekly';
      case 'MONTHLY':
        return 'Monthly';
      case 'CUSTOM_RANGE':
        return 'Custom Range';
      case 'AFTER_JOB':
        return 'After Job';
      default:
        return paymentType;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return colors.success;
      case 'WAITING_CONFIRMATION_APPROVAL':
        return colors.warning;
      case 'PENDING':
        return colors.info;
      case 'REJECTED':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'Confirmed';
      case 'WAITING_CONFIRMATION_APPROVAL':
        return 'Waiting Confirmation';
      case 'PENDING':
        return 'Pending';
      case 'REJECTED':
        return 'Rejected';
      default:
        return status;
    }
  };

  const getReportStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return colors.success;
      case 'PENDING':
        return colors.warning;
      case 'REJECTED':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getReportStatusLabel = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'Approved';
      case 'PENDING':
        return 'Pending';
      case 'REJECTED':
        return 'Rejected';
      default:
        return status;
    }
  };

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'PAYMENT_ISSUES':
        return 'Payment Issues';
      case 'NOT_FOLLOWING_JOB_LAWS':
        return 'Not Following Job Laws';
      case 'STEALING':
        return 'Stealing';
      case 'MISSING':
        return 'Missing';
      case 'WORK_COMPLETED':
        return 'Work Completed';
      default:
        return type;
    }
  };

  const getReportStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return CheckCircle2;
      case 'PENDING':
        return Clock3;
      case 'REJECTED':
        return XCircle;
      default:
        return FileText;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <Text style={styles.loadingText}>Loading employment details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!employment) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft color={colors.text} size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Employment Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Employment not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const StatusIcon = getStatusIcon(employment.status);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Employment Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      >
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
        >
          {/* Employment Overview */}
          <Card style={styles.overviewCard}>
            <View style={styles.overviewHeader}>
              <View style={styles.titleContainer}>
                <Text style={styles.employmentTitle}>{employment.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(employment.status) + '15' }]}>
                  <StatusIcon color={getStatusColor(employment.status)} size={16} />
                  <Text style={[styles.statusText, { color: getStatusColor(employment.status) }]}>
                    {employment.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>
            </View>

            {employment.description && (
              <Text style={styles.description}>{employment.description}</Text>
            )}

            {/* Key Details */}
            <View style={styles.detailsGrid}>
              {employment.salary && (
                <View style={styles.detailItem}>
                  <DollarSign color={colors.primary} size={20} />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Salary</Text>
                    <Text style={styles.detailValue}>RWF {employment.salary.toLocaleString()}</Text>
                  </View>
                </View>
              )}

              <View style={styles.detailItem}>
                <Clock color={colors.primary} size={20} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Payment Type</Text>
                  <Text style={styles.detailValue}>{getPaymentTypeLabel(employment.paymentType)}</Text>
                </View>
              </View>

              {employment.startDate && (
                <View style={styles.detailItem}>
                  <Calendar color={colors.primary} size={20} />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Start Date</Text>
                    <Text style={styles.detailValue}>
                      {new Date(employment.startDate).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.detailItem}>
                <Calendar color={colors.primary} size={20} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Created</Text>
                  <Text style={styles.detailValue}>
                    {new Date(employment.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>
          </Card>

          {/* Employer Information */}
          <Card style={styles.partyCard}>
            <View style={styles.partyHeader}>
              <Building color={colors.primary} size={24} />
              <Text style={styles.partyTitle}>Employer</Text>
            </View>
            <View style={styles.partyInfo}>
              <View style={styles.partyAvatar}>
                <UserIcon color={colors.primary} size={24} />
              </View>
              <View style={styles.partyDetails}>
                <Text style={styles.partyName}>
                  {employment.employer.firstName} {employment.employer.lastName}
                </Text>
                <Text style={styles.partyCode}>Code: {employment.employer.code}</Text>
                <View style={styles.partyContact}>
                  <View style={styles.contactItem}>
                    <Phone color={colors.textSecondary} size={14} />
                    <Text style={styles.contactText}>{employment.employer.phoneNumber}</Text>
                  </View>
                  <View style={styles.contactItem}>
                    <Mail color={colors.textSecondary} size={14} />
                    <Text style={styles.contactText}>{employment.employer.email}</Text>
                  </View>
                </View>
                <View style={styles.locationInfo}>
                  <MapPin color={colors.textSecondary} size={14} />
                  <Text style={styles.locationText}>
                    {employment.employer.province}, {employment.employer.district}
                  </Text>
                </View>
              </View>
            </View>
          </Card>

          {/* Employee Information */}
          <Card style={styles.partyCard}>
            <View style={styles.partyHeader}>
              <UserIcon color={colors.primary} size={24} />
              <Text style={styles.partyTitle}>Employee</Text>
            </View>
            <View style={styles.partyInfo}>
              <View style={styles.partyAvatar}>
                <UserIcon color={colors.primary} size={24} />
              </View>
              <View style={styles.partyDetails}>
                <Text style={styles.partyName}>
                  {employment.employee.firstName} {employment.employee.lastName}
                </Text>
                <Text style={styles.partyCode}>Code: {employment.employee.code}</Text>
                <View style={styles.partyContact}>
                  <View style={styles.contactItem}>
                    <Phone color={colors.textSecondary} size={14} />
                    <Text style={styles.contactText}>{employment.employee.phoneNumber}</Text>
                  </View>
                  <View style={styles.contactItem}>
                    <Mail color={colors.textSecondary} size={14} />
                    <Text style={styles.contactText}>{employment.employee.email}</Text>
                  </View>
                </View>
                <View style={styles.locationInfo}>
                  <MapPin color={colors.textSecondary} size={14} />
                  <Text style={styles.locationText}>
                    {employment.employee.province}, {employment.employee.district}
                  </Text>
                </View>
              </View>
            </View>
          </Card>

          {/* Employment Status Details */}
          <Card style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Briefcase color={colors.primary} size={24} />
              <Text style={styles.statusTitle}>Employment Status</Text>
            </View>
            
            <View style={styles.statusDetails}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Current Status:</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(employment.status) + '15' }]}>
                  <StatusIcon color={getStatusColor(employment.status)} size={14} />
                  <Text style={[styles.statusText, { color: getStatusColor(employment.status) }]}>
                    {employment.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>

              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Active:</Text>
                <Text style={[styles.statusValue, { color: employment.isActive ? colors.success : colors.error }]}>
                  {employment.isActive ? 'Yes' : 'No'}
                </Text>
              </View>

              {employment.resignationStatus !== 'NONE' && (
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Resignation Status:</Text>
                  <Text style={styles.statusValue}>
                    {employment.resignationStatus.replace('_', ' ')}
                  </Text>
                </View>
              )}

              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Last Updated:</Text>
                <Text style={styles.statusValue}>
                  {new Date(employment.updatedAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </Card>

          {/* Job Payments Section */}
          {employment.jobPayments && employment.jobPayments.length > 0 && (
            <Card style={styles.paymentsCard}>
              <View style={styles.paymentsHeader}>
                <Receipt color={colors.primary} size={24} />
                <Text style={styles.paymentsTitle}>Job Payments</Text>
              </View>
              
              <View style={styles.paymentsList}>
                {employment.jobPayments
                  .sort((a: JobPayment, b: JobPayment) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                  .map((payment: JobPayment) => (
                    <View key={payment.id} style={styles.paymentItem}>
                      <View style={styles.paymentInfo}>
                        <View style={styles.paymentHeader}>
                          <View style={styles.paymentAmountContainer}>
                            <DollarSign color={colors.primary} size={20} />
                            <Text style={styles.paymentAmount}>
                              RWF {payment.amount.toLocaleString()}
                            </Text>
                          </View>
                          <View style={[
                            styles.paymentStatus,
                            { backgroundColor: getPaymentStatusColor(payment.status) + '20' }
                          ]}>
                            <Text style={[
                              styles.paymentStatusText,
                              { color: getPaymentStatusColor(payment.status) }
                            ]}>
                              {getPaymentStatusLabel(payment.status)}
                            </Text>
                          </View>
                        </View>
                        
                        <Text style={styles.paymentDate}>
                          Due: {new Date(payment.dueDate).toLocaleDateString()}
                        </Text>
                        
                        {payment.paidAt && (
                          <Text style={styles.paymentDate}>
                            Paid: {new Date(payment.paidAt).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                      
                      {/* Payment Action Buttons */}
                      <View style={styles.paymentActionsContainer}>
                        {/* Pay Button for Employers on Pending Payments */}
                        {payment.status === 'PENDING' && isEmployer() && (
                          <TouchableOpacity
                            style={[styles.paymentActionButton, styles.paymentActionButtonPrimary]}
                            onPress={() => showPaymentActionModalForPayment(payment, 'pay')}
                            activeOpacity={0.7}
                          >
                            <DollarSign color={colors.white} size={16} />
                            <Text style={[styles.paymentActionButtonText, { color: colors.white }]}>
                              Pay
                            </Text>
                          </TouchableOpacity>
                        )}

                        {/* Confirm/Reject Buttons for Employees on Paid Payments */}
                        {payment.status === 'PAID' && isEmployee() && (
                          <>
                            <TouchableOpacity
                              style={[styles.paymentActionButton, styles.paymentActionButtonSuccess]}
                              onPress={() => showPaymentActionModalForPayment(payment, 'confirm')}
                              activeOpacity={0.7}
                            >
                              <CheckCircle color={colors.white} size={16} />
                              <Text style={[styles.paymentActionButtonText, { color: colors.white }]}>
                                Confirm
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.paymentActionButton, styles.paymentActionButtonDanger]}
                              onPress={() => showPaymentActionModalForPayment(payment, 'reject')}
                              activeOpacity={0.7}
                            >
                              <XCircle color={colors.white} size={16} />
                              <Text style={[styles.paymentActionButtonText, { color: colors.white }]}>
                                Reject
                              </Text>
                            </TouchableOpacity>
                          </>
                        )}

                        {/* Report Button for Pending Payments (Employee only) */}
                        {payment.status === 'PENDING' && isEmployee() && (
                          <TouchableOpacity
                            style={[styles.paymentActionButton, styles.paymentActionButtonWarning]}
                            onPress={() => showReportModalForEmployment(payment)}
                            activeOpacity={0.7}
                          >
                            <AlertTriangle color={colors.white} size={16} />
                            <Text style={[styles.paymentActionButtonText, { color: colors.white }]}>
                              Report Issue
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))}
              </View>
            </Card>
          )}

          {/* Reports Section */}
          {employment.reports && employment.reports.length > 0 && (
            <Card style={styles.reportsCard}>
              <View style={styles.reportsHeader}>
                <FileText color={colors.primary} size={24} />
                <Text style={styles.reportsTitle}>Reports</Text>
              </View>
              
              <View style={styles.reportsList}>
                {employment.reports
                  .sort((a: EmploymentReport, b: EmploymentReport) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime())
                  .map((report: EmploymentReport) => {
                    const StatusIcon = getReportStatusIcon(report.status);
                    return (
                      <View key={report.id} style={styles.reportItem}>
                        <View style={styles.reportInfo}>
                          <View style={styles.reportHeader}>
                            <View style={styles.reportTypeContainer}>
                              <Text style={styles.reportType}>
                                {getReportTypeLabel(report.type)}
                              </Text>
                            </View>
                            <View style={[
                              styles.reportStatus,
                              { backgroundColor: getReportStatusColor(report.status) + '20' }
                            ]}>
                              <StatusIcon color={getReportStatusColor(report.status)} size={16} />
                              <Text style={[
                                styles.reportStatusText,
                                { color: getReportStatusColor(report.status) }
                              ]}>
                                {getReportStatusLabel(report.status)}
                              </Text>
                            </View>
                          </View>
                          
                          <Text style={styles.reportDescription}>
                            {report.description}
                          </Text>
                          
                          <View style={styles.reportDates}>
                            <Text style={styles.reportDate}>
                              Reported: {new Date(report.reportDate).toLocaleDateString()}
                            </Text>
                            <Text style={styles.reportDate}>
                              Created: {new Date(report.createdAt).toLocaleDateString()}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
              </View>
            </Card>
          )}

          {/* Report Button Card (Only for employers) */}
          {employment.status === 'ACTIVE' && isEmployer() && (
            <Card style={styles.reportCard}>
              <View style={styles.reportCardHeader}>
                <AlertTriangle color={colors.warning} size={24} />
                <Text style={styles.reportCardTitle}>Report Issues</Text>
              </View>
              <Text style={styles.reportCardDescription}>
                Report any issues with the employee's performance or behavior
              </Text>
              <TouchableOpacity
                style={styles.reportButton}
                onPress={() => showReportModalForEmployment()}
                activeOpacity={0.8}
              >
                <AlertTriangle color={colors.white} size={20} />
                <Text style={[styles.reportButtonText, { color: colors.white }]}>
                  Report Issue
                </Text>
              </TouchableOpacity>
            </Card>
          )}

          {/* Action Buttons */}
          {getAvailableActions().length > 0 && (
            <Card style={styles.actionsCard}>
              <View style={styles.actionsHeader}>
                <Target color={colors.primary} size={24} />
                <Text style={styles.actionsTitle}>Employment Actions</Text>
              </View>
              <View style={styles.actionsGrid}>
                {getAvailableActions().map((action, index) => {
                  const IconComponent = action.icon;
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.actionButton,
                        action.style === 'primary' ? styles.actionButtonPrimary : styles.actionButtonSecondary,
                        { borderColor: action.color }
                      ]}
                      onPress={() => showPinModalForAction(action.type, action.title, action.description)}
                      activeOpacity={0.8}
                    >
                      <IconComponent 
                        color={action.style === 'primary' ? colors.white : action.color} 
                        size={20} 
                      />
                      <Text style={[
                        styles.actionButtonText,
                        { color: action.style === 'primary' ? colors.white : action.color }
                      ]}>
                        {action.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Card>
          )}
        </MotiView>
      </ScrollView>

      {/* PIN Input Bottom Sheet */}
      <BottomSheet
        ref={pinBottomSheetRef}
        index={-1}
        snapPoints={['50%']}
        enablePanDownToClose
        onClose={() => setShowPinModal(false)}
        backgroundStyle={{ backgroundColor: colors.background }}
        handleIndicatorStyle={{ backgroundColor: colors.border }}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{pendingAction?.title}</Text>
            <TouchableOpacity
              onPress={() => pinBottomSheetRef.current?.close()}
              style={styles.modalCloseButton}
            >
              <XCircle color={colors.textSecondary} size={24} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.modalDescription}>{pendingAction?.description}</Text>
            
            <View style={styles.pinInputContainer}>
              <Text style={styles.pinLabel}>Enter your PIN/Password</Text>
              <View style={styles.pinInputWrapper}>
                <BottomSheetTextInput
                  style={styles.pinInput}
                  value={pin}
                  onChangeText={setPin}
                  placeholder="Enter PIN/Password"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showPin}
                  autoFocus
                />
                <TouchableOpacity
                  onPress={() => setShowPin(!showPin)}
                  style={styles.pinToggle}
                >
                  {showPin ? (
                    <EyeOff color={colors.textSecondary} size={20} />
                  ) : (
                    <Eye color={colors.textSecondary} size={20} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => pinBottomSheetRef.current?.close()}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalButtonText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={executeAction}
                disabled={!pin.trim() || approveEmploymentMutation.isPending}
                activeOpacity={0.8}
              >
                {approveEmploymentMutation.isPending ? (
                  <LoadingSpinner size="small" color={colors.white} />
                ) : (
                  <Text style={[styles.modalButtonText, { color: colors.white }]}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </BottomSheetView>
      </BottomSheet>

      {/* Payment Action Bottom Sheet */}
      <BottomSheet
        ref={paymentActionBottomSheetRef}
        index={-1}
        snapPoints={['60%']}
        enablePanDownToClose
        onClose={closePaymentActionModal}
        backgroundStyle={{ backgroundColor: colors.background }}
        handleIndicatorStyle={{ backgroundColor: colors.border }}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {paymentActionType === 'pay' && 'Pay Job Payment'}
              {paymentActionType === 'confirm' && 'Confirm Payment'}
              {paymentActionType === 'reject' && 'Reject Payment'}
            </Text>
            <TouchableOpacity
              onPress={closePaymentActionModal}
              style={styles.modalCloseButton}
            >
              <XCircle color={colors.textSecondary} size={24} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.modalDescription}>
              {paymentActionType === 'pay' && 'Confirm that you have paid this job payment. Enter your PIN to proceed.'}
              {paymentActionType === 'confirm' && 'Confirm that you have received this payment. Enter your PIN to proceed.'}
              {paymentActionType === 'reject' && 'Reject this payment if there are any issues. Enter your PIN to proceed.'}
            </Text>
            
            {selectedPaymentForAction && (
              <View style={styles.paymentSummary}>
                <Text style={styles.paymentSummaryTitle}>Payment Details:</Text>
                <Text style={styles.paymentSummaryAmount}>
                  RWF {selectedPaymentForAction.amount.toLocaleString()}
                </Text>
                <Text style={styles.paymentSummaryDue}>
                  Due: {new Date(selectedPaymentForAction.dueDate).toLocaleDateString()}
                </Text>
              </View>
            )}
            
            <View style={styles.pinInputContainer}>
              <Text style={styles.pinLabel}>Enter your PIN/Password</Text>
              <View style={styles.pinInputWrapper}>
                <BottomSheetTextInput
                  style={styles.pinInput}
                  value={pin}
                  onChangeText={setPin}
                  placeholder="Enter PIN/Password"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showPin}
                  autoFocus
                />
                <TouchableOpacity
                  onPress={() => setShowPin(!showPin)}
                  style={styles.pinToggle}
                >
                  {showPin ? (
                    <EyeOff color={colors.textSecondary} size={20} />
                  ) : (
                    <Eye color={colors.textSecondary} size={20} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={closePaymentActionModal}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalButtonText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.modalButtonPrimary,
                  (!pin.trim()) && styles.modalButtonDisabled
                ]}
                onPress={executePaymentAction}
                disabled={!pin.trim()}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalButtonText, { color: colors.white }]}>
                  {paymentActionType === 'pay' && 'Mark as Paid'}
                  {paymentActionType === 'confirm' && 'Confirm Payment'}
                  {paymentActionType === 'reject' && 'Reject Payment'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </BottomSheetView>
      </BottomSheet>

      {/* Employment Report Modal */}
      {employment && getUserRole() && (
        <EmploymentReportModal
          visible={showReportModal}
          onClose={closeReportModal}
          employmentId={employment.id}
          userRole={getUserRole()!}
          paymentId={selectedPaymentForReport?.id}
          onReportSubmitted={handleReportSubmitted}
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontFamily: 'DMSans-Bold',
    color: colors.text,
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    marginTop: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  errorText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: 'DMSans-SemiBold',
    color: colors.error,
    textAlign: 'center',
  },
  overviewCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  overviewHeader: {
    marginBottom: Spacing.md,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  employmentTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: 'DMSans-Bold',
    color: colors.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: 'DMSans-SemiBold',
    textTransform: 'uppercase',
    marginLeft: Spacing.xs,
  },
  description: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  detailsGrid: {
    gap: Spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailContent: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  detailLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Medium',
    color: colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  detailValue: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-SemiBold',
    color: colors.text,
  },
  partyCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  partyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  partyTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: 'DMSans-Bold',
    color: colors.text,
    marginLeft: Spacing.sm,
  },
  partyInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  partyAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  partyDetails: {
    flex: 1,
  },
  partyName: {
    fontSize: Typography.fontSize.lg,
    fontFamily: 'DMSans-Bold',
    color: colors.text,
    marginBottom: Spacing.xs,
  },
  partyCode: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Medium',
    color: colors.primary,
    marginBottom: Spacing.sm,
  },
  partyContact: {
    marginBottom: Spacing.sm,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  contactText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  statusCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statusTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: 'DMSans-Bold',
    color: colors.text,
    marginLeft: Spacing.sm,
  },
  statusDetails: {
    gap: Spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusLabel: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Medium',
    color: colors.text,
  },
  statusValue: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-SemiBold',
    color: colors.textSecondary,
  },
  actionsCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  actionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionsTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: 'DMSans-Bold',
    color: colors.text,
    marginLeft: Spacing.sm,
  },
  actionsGrid: {
    gap: Spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    borderWidth: 2,
    minHeight: 56,
  },
  actionButtonPrimary: {
    backgroundColor: colors.primary,
  },
  actionButtonSecondary: {
    backgroundColor: 'transparent',
  },
  actionButtonText: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-SemiBold',
    marginLeft: Spacing.sm,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: 'DMSans-Bold',
    color: colors.text,
    flex: 1,
  },
  modalCloseButton: {
    padding: Spacing.sm,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  modalDescription: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  pinInputContainer: {
    marginBottom: Spacing.xl,
  },
  pinLabel: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Medium',
    color: colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  pinInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: Spacing.md,
  },
  pinInput: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    fontFamily: 'DMSans-Medium',
    color: colors.text,
    paddingVertical: Spacing.md,
    textAlign: 'center',
  },
  pinToggle: {
    padding: Spacing.sm,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  modalButtonPrimary: {
    backgroundColor: colors.primary,
  },
  modalButtonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtonText: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-SemiBold',
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  paymentsCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  paymentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  paymentsTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: 'DMSans-Bold',
    color: colors.text,
    marginLeft: Spacing.sm,
  },
  paymentsList: {
    gap: Spacing.md,
  },
  paymentItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentInfo: {
    marginBottom: Spacing.sm,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  paymentAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentAmount: {
    fontSize: Typography.fontSize.lg,
    fontFamily: 'DMSans-Bold',
    color: colors.text,
    marginLeft: Spacing.xs,
  },
  paymentStatus: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
  },
  paymentStatusText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: 'DMSans-SemiBold',
    textTransform: 'uppercase',
  },
  paymentDate: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  paymentNotes: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  paymentActionsContainer: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  paymentActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    gap: Spacing.xs,
    minWidth: 100,
  },
  paymentActionButtonPrimary: {
    backgroundColor: colors.primary,
  },
  paymentActionButtonSuccess: {
    backgroundColor: colors.success,
  },
  paymentActionButtonDanger: {
    backgroundColor: colors.error,
  },
  paymentActionButtonWarning: {
    backgroundColor: colors.warning,
  },
  paymentActionButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-SemiBold',
  },
  paymentSummary: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentSummaryTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Medium',
    color: colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  paymentSummaryAmount: {
    fontSize: Typography.fontSize.lg,
    fontFamily: 'DMSans-Bold',
    color: colors.text,
    marginBottom: Spacing.xs,
  },
  paymentSummaryDue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
  },
  modalButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.6,
  },
  reportCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  reportCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  reportCardTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: 'DMSans-Bold',
    color: colors.text,
    marginLeft: Spacing.sm,
  },
  reportCardDescription: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    backgroundColor: colors.warning,
    gap: Spacing.xs,
  },
  reportButtonText: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-SemiBold',
  },
  reportsCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  reportsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reportsTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: 'DMSans-Bold',
    color: colors.text,
    marginLeft: Spacing.sm,
  },
  reportsList: {
    gap: Spacing.md,
  },
  reportItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reportInfo: {
    flex: 1,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  reportTypeContainer: {
    flex: 1,
  },
  reportType: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-SemiBold',
    color: colors.text,
  },
  reportStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
    gap: Spacing.xs,
  },
  reportStatusText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: 'DMSans-SemiBold',
    textTransform: 'uppercase',
  },
  reportDescription: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  reportDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reportDate: {
    fontSize: Typography.fontSize.xs,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
  },
});
