import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ViewStyle,
  TextStyle,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { DebtDetailSkeleton } from '@/components/ui/DebtDetailSkeleton';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/contexts/TranslationContext';
import { useToast } from '@/contexts/ToastContext';
import { useCurrentUser, useDebtById, usePayDebt, useConfirmDebtPayment } from '@/hooks';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { apiClient, type Debt, type User } from '@/services/api';
import { MotiView } from 'moti';
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  User as UserIcon,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  EyeOff,
  TrendingUp,
  FileText,
  CreditCard,
  Shield,
  AlertCircle,
  CheckSquare,
  XSquare,
  Clock4,
  CalendarDays,
  UserCheck,
  UserX,
  Receipt,
  Package,
  Info,
  Lock,
} from 'lucide-react-native';

interface ExtendedDebt {
  id: string;
  amount: string;
  amountPaid: string;
  paymentDate: string;
  status:
    | 'PENDING'
    | 'ACTIVE'
    | 'COMPLETED'
    | 'PAID_PENDING_CONFIRMATION'
    | 'OVERDUE'
    | 'REJECTED';
  requester: {
    id: string;
    firstName: string;
    lastName: string;
  };
  issuer: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
  initiationType: 'REQUESTED' | 'OFFERED';
  payments?: Array<{
    id: string;
    amount: string;
    createdAt: string;
    confirmedByIssuer: boolean;
  }>;
  items?: Array<{
    id: string;
    name: string;
    description: string;
    quantity: number;
    amount: string;
    totalAmount: string;
    createdAt: string;
  }>;
}

function getStatusBadgeStyle(status: string, colors: any) {
  switch (status) {
    case 'ACTIVE':
      return { backgroundColor: colors.success + '20' };
    case 'PENDING':
      return { backgroundColor: colors.warning + '20' };
    case 'OVERDUE':
      return { backgroundColor: colors.error + '20' };
    case 'COMPLETED':
      return { backgroundColor: colors.info + '20' };
    case 'PAID_PENDING_CONFIRMATION':
      return { backgroundColor: colors.primary + '20' };
    default:
      return { backgroundColor: colors.card };
  }
}

function getStatusTextStyle(status: string, colors: any) {
  switch (status) {
    case 'ACTIVE':
      return { color: colors.success };
    case 'PENDING':
      return { color: colors.warning };
    case 'OVERDUE':
      return { color: colors.error };
    case 'COMPLETED':
      return { color: colors.info };
    case 'PAID_PENDING_CONFIRMATION':
      return { color: colors.primary };
    default:
      return { color: colors.textSecondary };
  }
}

export default function DebtDetailScreen() {
  // All hooks must be called unconditionally at the top level
  const params = useLocalSearchParams();
  const router = useRouter();
  const id = params.id as string;
  const { user: currentUser } = useCurrentUser();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();
  const styles = getStyles(colors);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [pinForApproval, setPinForApproval] = useState('');
  const [showPin, setShowPin] = useState(false);

  const [debt, setDebt] = useState<ExtendedDebt | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();

  // Helper function to transform debt data
  const transformDebtData = (debtData: any): ExtendedDebt => {
    console.log("Going to transform the debt data")
    console.log(debtData)
    return {
    id: debtData.id,
    amount: debtData.amount,
    amountPaid: debtData.amountPaid || '0',
    paymentDate: debtData.paymentDate || '',
    status: debtData.status,
    requester: debtData.requester,
    issuer: debtData.issuer,
    createdAt: debtData.createdAt,
    updatedAt: debtData.updatedAt,
    initiationType: debtData.initiationType,
    payments: debtData.payments || [],
    items: debtData.items || [],
  }};

  // Helper function to refetch debt data
  const refetchDebtData = async () => {
    try {
      const debtData = await apiClient.getDebtById(id);
      if (debtData) {
        setDebt(transformDebtData(debtData));
      }
    } catch (error) {
      console.error('Error refetching debt:', error);
    }
  };

  // Mutations must be called at the top level
  const payDebtMutation = usePayDebt();
  const confirmDebtPaymentMutation = useConfirmDebtPayment();

  const approveDebtMutation = useMutation({
    mutationFn: (data: { debtId: string; pin: string }) =>
      apiClient.approveDebt(data.debtId, data.pin),
    onSuccess: async () => {
      showSuccess('Debt Approved', 'You have successfully approved the debt.');
      // Manually refetch debt data
      await refetchDebtData();
      queryClient.invalidateQueries({ queryKey: ['debt', id] });
      queryClient.invalidateQueries({ queryKey: ['debts'] });
    },
    onError: (err: any) => {
      const errorMessage =
        err?.response?.data?.message ||
        'An error occurred while approving the debt.';
      showError('Approval Failed', errorMessage);
    },
  });

  const rejectDebtMutation = useMutation({
    mutationFn: apiClient.rejectDebt,
    onSuccess: async () => {
      showSuccess('Debt Rejected', 'You have successfully rejected the debt.');
      // Manually refetch debt data
      await refetchDebtData();
      queryClient.invalidateQueries({ queryKey: ['debt', id] });
      queryClient.invalidateQueries({ queryKey: ['debts'] });
    },
    onError: (err: any) => {
      const errorMessage =
        err?.response?.data?.message ||
        'An error occurred while rejecting the debt.';
      showError('Rejection Failed', errorMessage);
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: (data: { paymentId: string; pin: string }) =>
      apiClient.confirmPayment(data.paymentId, data.pin),
    onSuccess: async () => {
      showSuccess('Payment Confirmed', 'Payment has been confirmed successfully.');
      // Clear PIN input for next confirmation
      setPinForApproval('');
      // Manually refetch debt data
      await refetchDebtData();
      queryClient.invalidateQueries({ queryKey: ['debt', id] });
      queryClient.invalidateQueries({ queryKey: ['debts'] });
    },
    onError: (err: any) => {
      const errorMessage =
        err?.response?.data?.message ||
        'An error occurred while confirming the payment.';
      showError('Confirmation Failed', errorMessage);
    },
  });

  const rejectPaymentMutation = useMutation({
    mutationFn: (data: { paymentId: string; pin: string }) =>
      apiClient.rejectPayment(data.paymentId, data.pin),
    onSuccess: async () => {
      showSuccess('Payment Rejected', 'Payment has been rejected successfully.');
      // Clear PIN input for next rejection
      setPinForApproval('');
      // Manually refetch debt data
      await refetchDebtData();
      queryClient.invalidateQueries({ queryKey: ['debt', id] });
      queryClient.invalidateQueries({ queryKey: ['debts'] });
    },
    onError: (err: any) => {
      const errorMessage =
        err?.response?.data?.message ||
        'An error occurred while rejecting the payment.';
      showError('Rejection Failed', errorMessage);
    },
  });



  // Use TanStack Query for fetching debt details
  const { data: debtData, isLoading: isLoadingDebt, error: debtError } = useDebtById(id);

  // Transform debt data when it's available
  useEffect(() => {
    if (debtData) {
      const transformedDebt: ExtendedDebt = transformDebtData(debtData);
      setDebt(transformedDebt);
    }
  }, [debtData]);

  // Handle error state
  useEffect(() => {
    if (debtError) {
      const errorMessage = debtError instanceof Error ? debtError.message : 'Failed to load debt details';
      setError(new Error(errorMessage));
      showError('Error', errorMessage);
    }
  }, [debtError, showError]);

  // Handle loading state
  if (isLoadingDebt) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft color={colors.text} size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Debt Details</Text>
        </View>
        <DebtDetailSkeleton />
      </SafeAreaView>
    );
  }

  // Handle error or not found state
  if (error && !debt) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Debt not found</Text>
        <Text style={styles.errorText}>{error.message}</Text>
        <Button
          title="Back to Debts"
          onPress={() => router.back()}
          style={styles.backButton}
        />
      </View>
    );
  }

  const handlePayment = () => {
    if (!debt) return;
    
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      showError('Invalid Amount', 'Please enter a valid payment amount');
      return;
    }

    const amount = parseFloat(paymentAmount);
    // Calculate remaining amount based on confirmed payments
    const confirmedPaymentsTotal = payments
      ?.filter(p => p.confirmedByIssuer)
      ?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
    const remainingAmount = parseFloat(debt.amount) - confirmedPaymentsTotal;
    
    if (amount > remainingAmount) {
      showError('Amount Too High', `Payment amount cannot exceed remaining debt of ${remainingAmount.toLocaleString()} RWF`);
      return;
    }

    payDebtMutation.mutate({ debtId: id, amount: paymentAmount });
  };

  const handleApprove = () => {
    if (!pinForApproval || pinForApproval.length < 4) {
      showError('Invalid PIN', 'Please enter your 4-6 digit PIN');
      return;
    }

    approveDebtMutation.mutate({
      debtId: id,
      pin: pinForApproval,
    });
  };

  const handleReject = () => {
    rejectDebtMutation.mutate(id as string);
  };

  const handleConfirmPaid = () => {
    if (!pinForApproval || pinForApproval.length < 4) {
      showError('Invalid PIN', 'Please enter a valid 4-digit PIN.');
      return;
    }

    confirmDebtPaymentMutation.mutate({
      debtId: id,
      pin: pinForApproval,
    });
  };

  const handleConfirmPayment = (paymentId: string) => {
    if (!pinForApproval || pinForApproval.length < 4) {
      showError('Invalid PIN', 'Please enter a valid 4-digit PIN.');
      return;
    }

    confirmPaymentMutation.mutate({
      paymentId: paymentId,
      pin: pinForApproval,
    });
  };

  if (!debt && !isLoadingDebt) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Debt not found</Text>
        <Text style={styles.errorText}>Debt not found</Text>
      </SafeAreaView>
    );
  }

  if (!debt) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Debt not found</Text>
      </SafeAreaView>
    );
  }

  const {
    requester,
    issuer,
    amount,
    amountPaid,
    status,
    initiationType,
    payments,
  } = debt;
  const isRequester = currentUser?.id === requester.id;
  const isIssuer = currentUser?.id === issuer.id;

  // Determine available actions based on user role and debt status
  const canPay = isRequester && (status === 'ACTIVE' || status === 'OVERDUE');
  const canConfirm = isIssuer && status === 'PAID_PENDING_CONFIRMATION';

  // Logic for who can approve or reject a PENDING debt:
  // - If the debt was REQUESTED, the ISSUER must approve/reject.
  // - If the debt was OFFERED, the REQUESTER must approve/reject.
  const canApproveOrReject =
    status === 'PENDING' &&
    ((initiationType === 'REQUESTED' && isIssuer) ||
      (initiationType === 'OFFERED' && isRequester));

  const canViewActions = canPay || canApproveOrReject || canConfirm;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Debt Details</Text>
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.scrollContainer}>
          <ScrollView 
            key={`scroll-${debt?.id}-${debt?.status}`}
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            scrollEnabled={true}
            bounces={true}
            nestedScrollEnabled={true}
            removeClippedSubviews={false}
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
              autoscrollToTopThreshold: 10
            }}
          >
        <MotiView
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
        >
          <Card style={styles.amountCard}>
            <View style={styles.amountHeader}>
              <View style={styles.amountIconContainer}>
                <DollarSign color={colors.white} size={28} />
              </View>
              <View style={styles.amountContent}>
                <Text style={styles.amountLabel}>Total Amount</Text>
                <Text style={styles.amount}>
                  RWF {parseFloat(debt.amount).toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusBadge,
                  getStatusBadgeStyle(debt.status, colors),
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    getStatusTextStyle(debt.status, colors),
                  ]}
                >
                  {debt.status.replace(/_/g, ' ')}
                </Text>
              </View>
              
              <View style={[
                styles.debtTypeBadge,
                { backgroundColor: debt.initiationType === 'REQUESTED' ? colors.primary + '15' : colors.success + '15' }
              ]}>
                <Text style={[
                  styles.debtTypeText,
                  { color: debt.initiationType === 'REQUESTED' ? colors.primary : colors.success }
                ]}>
                  {debt.initiationType === 'REQUESTED' ? 'Requested' : 'Offered'}
                </Text>
              </View>
            </View>

            {parseFloat(debt.amountPaid || '0') > 0 && (
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <TrendingUp color={colors.success} size={20} />
                  <Text style={styles.progressLabel}>Payment Progress</Text>
                </View>
                
                {/* Calculate confirmed payments total */}
                {debt && (() => {
                  const confirmedPaymentsTotal = payments
                    ?.filter(p => p.confirmedByIssuer)
                    ?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
                  
                  const remainingAmount = parseFloat(debt.amount) - confirmedPaymentsTotal;
                  const progressPercentage = (confirmedPaymentsTotal / parseFloat(debt.amount)) * 100;
                  
                  return (
                    <>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${Math.min(progressPercentage, 100)}%`,
                            },
                          ]}
                        />
                      </View>
                      
                      <View style={styles.progressDetails}>
                        <View style={styles.progressRow}>
                          <Text style={styles.progressText}>
                            Confirmed: {confirmedPaymentsTotal.toLocaleString()} RWF
                          </Text>
                          <Text style={styles.progressText}>
                            {progressPercentage.toFixed(1)}%
                          </Text>
                        </View>
                        
                        <View style={styles.progressRow}>
                          <Text style={styles.progressText}>
                            Remaining: {remainingAmount.toLocaleString()} RWF
                          </Text>
                          <Text style={styles.progressText}>
                            Total: {parseFloat(debt.amount).toLocaleString()} RWF
                          </Text>
                        </View>
                      </View>
                    </>
                  );
                })()}
              </View>
            )}

            {/* Payment Summary */}
            {debt && payments && payments.length > 0 && (() => {
                  const confirmedPayments = payments.filter(p => p.confirmedByIssuer);
                  const pendingPayments = payments.filter(p => !p.confirmedByIssuer);
                  
                  const confirmedTotal = confirmedPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
                  const pendingTotal = pendingPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
                  const remainingAmount = parseFloat(debt.amount) - confirmedTotal;
                  
                  return (
                    <View style={styles.summaryGrid}>
                      <View style={styles.summaryItem}>
                        <View style={styles.summaryIconContainer}>
                          <CheckCircle color={colors.success} size={20} />
                        </View>
                        <Text style={styles.summaryLabel}>Confirmed Payments</Text>
                        <Text style={[styles.summaryValue, { color: colors.success }]}>
                          {confirmedTotal.toLocaleString()} RWF
                        </Text>
                        <Text style={styles.summaryCount}>
                          {confirmedPayments.length} payment{confirmedPayments.length !== 1 ? 's' : ''}
                        </Text>
                      </View>
                      
                      <View style={styles.summaryItem}>
                        <View style={styles.summaryIconContainer}>
                          <Clock4 color={colors.warning} size={20} />
                        </View>
                        <Text style={styles.summaryLabel}>Pending Confirmation</Text>
                        <Text style={[styles.summaryValue, { color: colors.warning }]}>
                          {pendingTotal.toLocaleString()} RWF
                        </Text>
                        <Text style={styles.summaryCount}>
                          {pendingPayments.length} payment{pendingPayments.length !== 1 ? 's' : ''}
                        </Text>
                      </View>
                      
                      <View style={styles.summaryItem}>
                        <View style={styles.summaryIconContainer}>
                          <Info color={colors.text} size={20} />
                        </View>
                        <Text style={styles.summaryLabel}>Remaining Amount</Text>
                        <Text style={[styles.summaryValue, { color: colors.text }]}>
                          {remainingAmount.toLocaleString()} RWF
                        </Text>
                        <Text style={styles.summaryCount}>
                          Debt Total: {parseFloat(debt.amount).toLocaleString()} RWF
                        </Text>
                      </View>
                    </View>
                  );
                })()}
          </Card>

          <Card style={styles.detailsCard}>
            <View style={styles.sectionHeader}>
              <FileText color={colors.primary} size={24} />
              <Text style={styles.sectionTitle}>Debt Details</Text>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <UserCheck color={colors.success} size={20} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>
                  {isRequester ? 'Lender' : 'Borrower'}
                </Text>
                <Text style={styles.detailValue}>
                  {isRequester
                    ? `${debt.issuer.firstName} ${debt.issuer.lastName}`
                    : `${debt.requester.firstName} ${debt.requester.lastName}`}
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <Shield color={colors.info} size={20} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Status</Text>
                <View
                  style={[
                    styles.statusBadge,
                    getStatusBadgeStyle(status, colors),
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      getStatusTextStyle(status, colors),
                    ]}
                  >
                    {status.replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>
            </View>

            {debt.paymentDate && (
              <View style={styles.detailItem}>
                <View style={styles.detailIconContainer}>
                  <CalendarDays color={colors.warning} size={20} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Due Date</Text>
                  <Text style={styles.detailValue}>
                    {new Date(debt.paymentDate).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <Clock4 color={colors.gray[500]} size={20} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Created</Text>
                <Text style={styles.detailValue}>
                  {new Date(debt.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </Card>

          {/* Items Section */}
          {debt.items && debt.items.length > 0 && (
            <Card style={styles.itemsCard}>
              <View style={styles.sectionHeader}>
                <Package color={colors.primary} size={24} />
                <Text style={styles.sectionTitle}>Items</Text>
              </View>
              
              {debt.items
                .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())
                .map((item, index) => (
                  <View key={item.id} style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <View style={styles.itemHeader}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <View style={styles.itemQuantityBadge}>
                          <Text style={styles.itemQuantityText}>Qty: {item.quantity}</Text>
                        </View>
                      </View>
                      {item.description && (
                        <Text style={styles.itemDescription}>{item.description}</Text>
                      )}
                    </View>
                    
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemAmount}>
                        {parseFloat(item.amount).toLocaleString()} RWF
                      </Text>
                      <Text style={styles.itemTotal}>
                        Total: {parseFloat(item.totalAmount).toLocaleString()} RWF
                      </Text>
                    </View>
                  </View>
                ))}
            </Card>
          )}

          {/* Payments Section */}
          {payments && payments.length > 0 && (
            <Card style={styles.paymentsCard}>
              <View style={styles.sectionHeader}>
                <CreditCard color={colors.primary} size={24} />
                <Text style={styles.sectionTitle}>Payment History</Text>
              </View>
              
              {payments
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                .map((payment, index) => {
                  // Find the first unconfirmed payment to show PIN input
                  const isFirstUnconfirmed = !payment.confirmedByIssuer && 
                    payments
                      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                      .findIndex(p => !p.confirmedByIssuer) === index;
                  
                  return (
                    <View key={payment.id} style={styles.paymentItem}>
                      <View style={styles.paymentInfo}>
                        <View style={styles.paymentHeader}>
                          <View style={styles.paymentAmountContainer}>
                            <Receipt color={payment.confirmedByIssuer ? colors.success : colors.warning} size={20} />
                            <Text style={styles.paymentAmount}>
                              {parseFloat(payment.amount).toLocaleString()} RWF
                            </Text>
                          </View>
                          <View style={[
                            styles.paymentStatus,
                            { backgroundColor: payment.confirmedByIssuer ? colors.success + '20' : colors.warning + '20' }
                          ]}>
                            {payment.confirmedByIssuer ? (
                              <CheckSquare color={colors.success} size={16} />
                            ) : (
                              <Clock4 color={colors.warning} size={16} />
                            )}
                            <Text style={[
                              styles.paymentStatusText,
                              { color: payment.confirmedByIssuer ? colors.success : colors.warning }
                            ]}>
                              {payment.confirmedByIssuer ? 'Confirmed' : 'Pending'}
                            </Text>
                          </View>
                        </View>
                        
                        <Text style={styles.paymentDate}>
                          {new Date(payment.createdAt).toLocaleDateString()} at {new Date(payment.createdAt).toLocaleTimeString()}
                        </Text>
                      </View>
                      
                      {/* Confirm Payment Button for Issuer - Only show for first unconfirmed payment */}
                                              {isIssuer && !payment.confirmedByIssuer && isFirstUnconfirmed && (
                          <View style={styles.paymentActions}>
                            <View style={styles.pinInputContainer}>
                              <Text style={styles.pinInputLabel}>Enter PIN to confirm</Text>
                              <View style={styles.pinInputWrapper}>
                                <Lock color={colors.textSecondary} size={20} style={styles.pinInputIcon} />
                                <TextInput
                                  value={pinForApproval}
                                  onChangeText={setPinForApproval}
                                  placeholder="••••"
                                  secureTextEntry={!showPin}
                              
                                  style={styles.pinInputField}
                                  placeholderTextColor={colors.textSecondary}
                                />
                                <TouchableOpacity
                                  onPress={() => setShowPin(!showPin)}
                                  style={styles.pinInputSuffix}
                                >
                                  {showPin ? (
                                    <EyeOff color={colors.textSecondary} size={20} />
                                  ) : (
                                    <Eye color={colors.textSecondary} size={20} />
                                  )}
                                </TouchableOpacity>
                              </View>
                            </View>
                            <Button
                              title="Confirm Payment"
                              onPress={() => handleConfirmPayment(payment.id)}
                              loading={confirmPaymentMutation.isPending}
                              style={styles.confirmPaymentButton}
                              disabled={!pinForApproval || pinForApproval.length < 4}
                            />
                          </View>
                        )}

                      {/* Reject Payment Button for Issuer - Only show for first unconfirmed payment */}
                      {isIssuer && !payment.confirmedByIssuer && isFirstUnconfirmed && (
                        <View style={styles.paymentActions}>
                          <Button
                            title="Reject Payment"
                            onPress={() => {
                              if (!pinForApproval || pinForApproval.length < 4) {
                                showError('Invalid PIN', 'Please enter a valid 4-digit PIN.');
                                return;
                              }
                              rejectPaymentMutation.mutate({ 
                                paymentId: payment.id, 
                                pin: pinForApproval 
                              });
                            }}
                            loading={rejectPaymentMutation.isPending}
                            style={styles.rejectPaymentButton}
                            disabled={!pinForApproval || pinForApproval.length < 4 || rejectPaymentMutation.isPending}
                          />
                        </View>
                      )}
                    </View>
                  );
                })}
            </Card>
          )}

          {canViewActions && (
            <Card style={styles.actionCard}>
              <View style={styles.sectionHeader}>
                <TrendingUp color={colors.primary} size={24} />
                <Text style={styles.sectionTitle}>Actions</Text>
              </View>

              {/* Pay Debt Form */}
              {canPay && (
                <View style={styles.actionSection}>
                  <View style={styles.actionSectionHeader}>
                    <CreditCard color={colors.success} size={20} />
                    <Text style={styles.actionSectionTitle}>Make Payment</Text>
                  </View>
                  <Input
                    label="Payment Amount"
                    value={paymentAmount}
                    onChangeText={setPaymentAmount}
                    keyboardType="numeric"
                    placeholder={`Max: ${debt ? (() => {
                      const confirmedPaymentsTotal = payments
                        ?.filter(p => p.confirmedByIssuer)
                        ?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
                      const remainingAmount = parseFloat(debt.amount) - confirmedPaymentsTotal;
                      return remainingAmount.toLocaleString();
                    })() : '0'} RWF`}
                  />

                  <Button
                    title="Submit Payment"
                    onPress={handlePayment}
                    loading={payDebtMutation.isPending}
                    style={styles.actionButton}
                    disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                  />
                </View>
              )}

              {/* Approve/Reject Debt */}
              {canApproveOrReject && (
                <View style={styles.actionSection}>
                  <View style={styles.actionSectionHeader}>
                    <Shield color={colors.info} size={20} />
                    <Text style={styles.actionSectionTitle}>Approve Debt</Text>
                  </View>
                  <View style={styles.pinInputContainer}>
                    <Text style={styles.pinInputLabel}>Enter your PIN to approve</Text>
                    <View style={styles.pinInputWrapper}>
                      <Lock color={colors.textSecondary} size={20} style={styles.pinInputIcon} />
                      <TextInput
                        value={pinForApproval}
                        onChangeText={setPinForApproval}
                        placeholder="••••"
                        secureTextEntry={!showPin}
                    
                        style={styles.pinInputField}
                        placeholderTextColor={colors.textSecondary}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPin(!showPin)}
                        style={styles.pinInputSuffix}
                      >
                        {showPin ? (
                          <EyeOff color={colors.textSecondary} size={20} />
                        ) : (
                          <Eye color={colors.textSecondary} size={20} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.buttonGroup}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={handleReject}
                      disabled={rejectDebtMutation.isPending}
                      activeOpacity={0.8}
                    >
                      {rejectDebtMutation.isPending ? (
                        <LoadingSpinner size="small" />
                      ) : (
                        <>
                          <XCircle color={colors.error} size={20} style={styles.buttonIcon} />
                          <Text style={[styles.buttonText, { color: colors.error }]}>Reject</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={handleApprove}
                      disabled={!pinForApproval || pinForApproval.length < 4 || approveDebtMutation.isPending}
                      activeOpacity={0.8}
                    >
                      {approveDebtMutation.isPending ? (
                        <LoadingSpinner size="small" />
                      ) : (
                        <>
                          <CheckCircle color={colors.white} size={20} style={styles.buttonIcon} />
                          <Text style={[styles.buttonText, { color: colors.white }]}>Approve</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Confirm Payment */}
              {canConfirm && (
                <View style={styles.actionSection}>
                  <View style={styles.actionSectionHeader}>
                    <CheckCircle color={colors.success} size={20} />
                    <Text style={styles.actionSectionTitle}>Confirm Payment</Text>
                  </View>
                  <View style={styles.pinInputContainer}>
                    <Text style={styles.pinInputLabel}>Enter your PIN to confirm payment</Text>
                    <View style={styles.pinInputWrapper}>
                      <Lock color={colors.textSecondary} size={20} style={styles.pinInputIcon} />
                      <TextInput
                        value={pinForApproval}
                        onChangeText={setPinForApproval}
                        placeholder="••••"
                        secureTextEntry={!showPin}
                    
                        style={styles.pinInputField}
                        placeholderTextColor={colors.textSecondary}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPin(!showPin)}
                        style={styles.pinInputSuffix}
                      >
                        {showPin ? (
                          <EyeOff color={colors.textSecondary} size={20} />
                        ) : (
                          <Eye color={colors.textSecondary} size={20} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Button
                    title="Confirm Payment Received"
                    onPress={handleConfirmPaid}
                    loading={confirmDebtPaymentMutation.isPending}
                    style={styles.actionButton}
                    disabled={!pinForApproval || pinForApproval.length < 4}
                  />
                </View>
              )}
            </Card>
          )}
        </MotiView>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.lg,
      backgroundColor: colors.background,
    },
    loadingText: {
      marginTop: Spacing.md,
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.lg,
      backgroundColor: colors.background,
    },
    errorText: {
      fontSize: Typography.fontSize.xl,
      fontFamily: 'DMSans-Bold',
      color: colors.error,
      marginBottom: Spacing.lg,
      textAlign: 'center',
    },
    backButton: {
      marginRight: Spacing.md,
      padding: 4,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: Typography.fontSize.xl,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginLeft: Spacing.md,
      flex: 1,
    },
    scrollContainer: {
      flex: 1,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: Spacing.lg,
      paddingBottom: Spacing.xl,
      minHeight: '100%',
    },
    amountCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      alignItems: 'center',
      borderColor: colors.border,
      borderWidth: 1,
    },
    amountHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    amountIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    amountContent: {
      flex: 1,
    },
    amountLabel: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    amount: {
      fontSize: 32,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
    },
    statusRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: Spacing.md,
    },
    statusBadge: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: 16,
    },
    debtTypeBadge: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: 16,
    },
    debtTypeText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-SemiBold',
      textTransform: 'uppercase',
    },
    statusText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-SemiBold',
      textTransform: 'uppercase',
    },
    progressSection: {
      width: '100%',
      marginTop: Spacing.lg,
    },
    progressHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    progressLabel: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
      color: colors.textSecondary,
      marginLeft: Spacing.sm,
    },
    progressBar: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: Spacing.sm,
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 4,
    },
    progressText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    progressDetails: {
      marginTop: Spacing.sm,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    progressRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing.xs,
    },
    detailsCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      borderColor: colors.border,
      borderWidth: 1,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    sectionTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-SemiBold',
      color: colors.text,
      marginLeft: Spacing.sm,
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    detailIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      flexShrink: 0, // Prevent icon from shrinking
    },
    detailContent: {
      flex: 1,
      justifyContent: 'center',
    },
    detailLabel: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
      color: colors.textSecondary,
    },
    detailValue: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.text,
      marginTop: Spacing.xs,
    },
    actionCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      borderColor: colors.border,
      borderWidth: 1,
    },
    actionSection: {
      marginBottom: Spacing.lg,
      paddingTop: Spacing.sm,
    },
    actionSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    actionSectionTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-SemiBold',
      marginLeft: Spacing.sm,
      color: colors.text,
    },
    buttonGroup: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: Spacing.md,
      gap: Spacing.md,
    },
    rejectButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.error,
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.md,
    },
    approveButton: {
      backgroundColor: colors.success,
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.md,
    },
    buttonIcon: {
      marginRight: Spacing.xs,
    },
    buttonText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-SemiBold',
    },
    actionButton: {
      marginTop: Spacing.md,
    },
    paymentsCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      borderColor: colors.border,
      borderWidth: 1,
    },
    paymentItem: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingVertical: Spacing.md,
    },
    paymentInfo: {
      marginBottom: Spacing.sm,
    },
    paymentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.xs,
    },
    paymentAmountContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    paymentAmount: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
    },
    paymentStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: 12,
      gap: Spacing.xs,
    },
    paymentStatusText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
      textTransform: 'uppercase',
    },
    paymentDate: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
    },
    paymentActions: {
      marginTop: Spacing.sm,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    confirmPaymentButton: {
      marginTop: Spacing.sm,
    },
    rejectPaymentButton: {
      marginTop: Spacing.sm,
      backgroundColor: colors.error,
      borderColor: colors.error,
    },
    itemsCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      borderColor: colors.border,
      borderWidth: 1,
    },
    itemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    itemHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.xs,
    },
    itemQuantityBadge: {
      backgroundColor: colors.primary + '15',
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: 12,
    },
    itemQuantityText: {
      fontSize: Typography.fontSize.xs,
      fontFamily: 'DMSans-Medium',
      color: colors.primary,
    },
    itemInfo: {
      flex: 1,
      marginRight: Spacing.md,
    },
    itemName: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-SemiBold',
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    itemDescription: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
    },
    itemDetails: {
      alignItems: 'flex-end',
    },
    itemQuantity: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    itemAmount: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    itemTotal: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
    },
    summaryGrid: {
      flexDirection: 'column',
      justifyContent: 'space-between',
      marginTop: Spacing.md,
      gap: Spacing.md,
      width:"100%"
    },
    summaryItem: {
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      width: '100%',
    },
    summaryIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    summaryLabel: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
      textAlign: 'center',
    },
    summaryValue: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-Bold',
      marginBottom: Spacing.xs,
      textAlign: 'center',
    },
    summaryCount: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    pinInput: {
      marginBottom: Spacing.md,
    },
    pinInputContainer: {
      marginBottom: Spacing.md,
    },
    pinInputLabel: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    pinInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BorderRadius.md,
      overflow: 'hidden',
    },
    pinInputIcon: {
      marginLeft: Spacing.md,
      marginRight: Spacing.sm,
    },
    pinInputField: {
      flex: 1,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.sm,
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.text,
      minHeight: 48,
    },
    pinInputSuffix: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
    },
    simplePinInput: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.text,
      minHeight: 48,
    },
  });
