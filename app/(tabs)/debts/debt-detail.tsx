import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { InputPin } from '@/components/ui/InputPin';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { lightColors as Colors, Typography, Spacing } from '@/constants/theme';
import { apiClient } from '@/services/api';
import { useAuthContext } from '@/contexts/AuthContext';
import Toast from 'react-native-toast-message';
import { MotiView } from 'moti';
import {
  ChevronLeft,
  DollarSign,
  Calendar,
  User,
  CircleCheck as CheckCircle,
  Circle as XCircle,
  CreditCard,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

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
  const id = params.id as string;
  const { user } = useAuthContext();
  const { theme, colors } = useTheme();
  const isDark = theme === 'dark';
  const styles = getStyles(colors, isDark);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [pinForApproval, setPinForApproval] = useState('');
  const [isLoadingDebt, setIsLoadingDebt] = useState(true);
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
  const payDebtMutation = useMutation({
    mutationFn: (data: { amount: string }) => {
      return apiClient.payDebt(
        id as string,
        parseFloat(data.amount) // Default payment method
      );
    },
    onSuccess: async () => {
      Toast.show({
        type: 'success',
        text1: 'Payment Submitted',
        text2: 'Your payment has been submitted successfully.',
      });
      // Clear payment amount
      setPaymentAmount('');
      // Manually refetch debt data
      await refetchDebtData();
      // Refetch debt data
      queryClient.invalidateQueries({ queryKey: ['debt', id] });
      queryClient.invalidateQueries({ queryKey: ['debts'] });
    },
    onError: (err: any) => {
      const errorMessage =
        err?.response?.data?.message || 'An error occurred during payment.';
      Toast.show({
        type: 'error',
        text1: 'Payment Failed',
        text2: errorMessage,
      });
    },
  });

  const approveDebtMutation = useMutation({
    mutationFn: (data: { debtId: string; pin: string }) =>
      apiClient.approveDebt(data.debtId, data.pin),
    onSuccess: async () => {
      Toast.show({
        type: 'success',
        text1: 'Debt Approved',
        text2: 'You have successfully approved the debt.',
      });
      // Manually refetch debt data
      await refetchDebtData();
      queryClient.invalidateQueries({ queryKey: ['debt', id] });
      queryClient.invalidateQueries({ queryKey: ['debts'] });
    },
    onError: (err: any) => {
      const errorMessage =
        err?.response?.data?.message ||
        'An error occurred while approving the debt.';
      Toast.show({
        type: 'error',
        text1: 'Approval Failed',
        text2: errorMessage,
      });
    },
  });

  const rejectDebtMutation = useMutation({
    mutationFn: apiClient.rejectDebt,
    onSuccess: async () => {
      Toast.show({
        type: 'success',
        text1: 'Debt Rejected',
        text2: 'You have successfully rejected the debt.',
      });
      // Manually refetch debt data
      await refetchDebtData();
      queryClient.invalidateQueries({ queryKey: ['debt', id] });
      queryClient.invalidateQueries({ queryKey: ['debts'] });
    },
    onError: (err: any) => {
      const errorMessage =
        err?.response?.data?.message ||
        'An error occurred while rejecting the debt.';
      Toast.show({
        type: 'error',
        text1: 'Rejection Failed',
        text2: errorMessage,
      });
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: (data: { paymentId: string; pin: string }) =>
      apiClient.confirmPayment(data.paymentId, data.pin),
    onSuccess: async () => {
      Toast.show({
        type: 'success',
        text1: 'Payment Confirmed',
        text2: 'Payment has been confirmed successfully.',
      });
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
      Toast.show({
        type: 'error',
        text1: 'Confirmation Failed',
        text2: errorMessage,
      });
    },
  });

  const confirmDebtPaymentMutation = useMutation({
    mutationFn: (data: { debtId: string; pin: string }) =>
      apiClient.confirmDebtPayment(data.debtId, data.pin),
    onSuccess: async () => {
      Toast.show({
        type: 'success',
        text1: 'Debt Confirmed',
        text2: 'Debt payment has been confirmed successfully.',
      });
      // Manually refetch debt data
      await refetchDebtData();
      queryClient.invalidateQueries({ queryKey: ['debt', id] });
      queryClient.invalidateQueries({ queryKey: ['debts'] });
    },
    onError: (err: any) => {
      const errorMessage =
        err?.response?.data?.message ||
        'An error occurred while confirming the debt payment.';
      Toast.show({
        type: 'error',
        text1: 'Confirmation Failed',
        text2: errorMessage,
      });
    },
  });

  // Check if we have a valid ID before enabling the query
  const hasValidId = !!id;

  // Use useEffect to handle the API call instead of useQuery
  useEffect(() => {
    const fetchDebt = async () => {
      if (!id) {
        setError(new Error('No debt ID provided'));
        setIsLoadingDebt(false);
        return;
      }

      try {
        setIsLoadingDebt(true);
        const debtData = await apiClient.getDebtById(id);

        if (!debtData) {
          throw new Error('Failed to load debt details');
        }

        // Transform to ExtendedDebt format
        const transformedDebt: ExtendedDebt = transformDebtData(debtData);

        setDebt(transformedDebt);
        setError(null);
      } catch (err) {
        console.error('Error fetching debt details:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load debt details';
        setError(new Error(errorMessage));
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: errorMessage,
        });
      } finally {
        setIsLoadingDebt(false);
      }
    };

    fetchDebt();
  }, [id]);

  // Handle loading state
  if (isLoadingDebt) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size={32} />
        <Text style={styles.loadingText}>Loading debt details...</Text>
      </View>
    );
  }

  // Handle error or not found state
  if (error || !debt) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Debt not found</Text>
        <Button
          title="Back to Debts"
          onPress={() => router.back()}
          style={styles.backButton}
        />
      </View>
    );
  }

  const handlePayment = () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Amount',
        text2: 'Please enter a valid payment amount',
      });
      return;
    }

    const amount = parseFloat(paymentAmount);
    // Calculate remaining amount based on confirmed payments
    const confirmedPaymentsTotal = payments
      ?.filter(p => p.confirmedByIssuer)
      ?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
    const remainingAmount = parseFloat(debt.amount) - confirmedPaymentsTotal;
    
    if (amount > remainingAmount) {
      Toast.show({
        type: 'error',
        text1: 'Amount Too High',
        text2: `Payment amount cannot exceed remaining debt of ${remainingAmount.toLocaleString()} RWF`,
      });
      return;
    }

    payDebtMutation.mutate({ amount: paymentAmount });
  };

  const handleApprove = () => {
    if (!pinForApproval || pinForApproval.length < 4) {
      Toast.show({
        type: 'error',
        text1: 'Invalid PIN',
        text2: 'Please enter your 4-6 digit PIN',
      });
      return;
    }

    approveDebtMutation.mutate({
      debtId: id,
      pin: pinForApproval,
    });
  };

  const handleReject = () => {
    Alert.alert(
      'Reject Debt',
      'Are you sure you want to reject this debt? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => rejectDebtMutation.mutate(id as string),
        },
      ]
    );
  };

  const handleConfirmPaid = () => {
    if (!pinForApproval || pinForApproval.length < 4) {
      Toast.show({
        type: 'error',
        text1: 'Invalid PIN',
        text2: 'Please enter a valid 4-digit PIN.',
      });
      return;
    }

    confirmDebtPaymentMutation.mutate({
      debtId: id,
      pin: pinForApproval,
    });
  };

  const handleConfirmPayment = (paymentId: string) => {
    if (!pinForApproval || pinForApproval.length < 4) {
      Toast.show({
        type: 'error',
        text1: 'Invalid PIN',
        text2: 'Please enter a valid 4-digit PIN.',
      });
      return;
    }

    confirmPaymentMutation.mutate({
      paymentId: paymentId,
      pin: pinForApproval,
    });
  };

  if (isLoadingDebt) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner />
      </View>
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
  console.log("Here are the debts")
  console.log(payments)
  const isRequester = user?.id === requester.id;
  const isIssuer = user?.id === issuer.id;

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
          <ChevronLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Debt Details</Text>
      </View>

      <ScrollView style={styles.content}>
        <MotiView
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
        >
          <Card style={styles.amountCard}>
            <View style={styles.amountHeader}>
              <DollarSign color={Colors.primary} size={32} />
              <Text style={styles.amount}>
                {debt.amount.toLocaleString()}RWF
              </Text>
            </View>

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
                {debt.status}
              </Text>
            </View>

            {parseFloat(debt.amountPaid || '0') > 0 && (
              <View style={styles.progressSection}>
                <Text style={styles.progressLabel}>Payment Progress</Text>
                
                {/* Calculate confirmed payments total */}
                {(() => {
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
            {payments && payments.length > 0 && (() => {
                  const confirmedPayments = payments.filter(p => p.confirmedByIssuer);
                  const pendingPayments = payments.filter(p => !p.confirmedByIssuer);
                  
                  const confirmedTotal = confirmedPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
                  const pendingTotal = pendingPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
                  const remainingAmount = parseFloat(debt.amount) - confirmedTotal;
                  
                  return (
                    <View style={styles.summaryGrid}>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Confirmed Payments</Text>
                        <Text style={[styles.summaryValue, { color: colors.success }]}>
                          {confirmedTotal.toLocaleString()} RWF
                        </Text>
                        <Text style={styles.summaryCount}>
                          {confirmedPayments.length} payment{confirmedPayments.length !== 1 ? 's' : ''}
                        </Text>
                      </View>
                      
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Pending Confirmation</Text>
                        <Text style={[styles.summaryValue, { color: colors.warning }]}>
                          {pendingTotal.toLocaleString()} RWF
                        </Text>
                        <Text style={styles.summaryCount}>
                          {pendingPayments.length} payment{pendingPayments.length !== 1 ? 's' : ''}
                        </Text>
                      </View>
                      
                      <View style={styles.summaryItem}>
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
            <Text style={styles.sectionTitle}>Details</Text>

            <View style={styles.detailItem}>
              <User color={Colors.gray[500]} size={20} />
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
                <Calendar color={Colors.gray[500]} size={20} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Due Date</Text>
                  <Text style={styles.detailValue}>
                    {new Date(debt.paymentDate).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Created</Text>
              <Text style={styles.detailValue}>
                {new Date(debt.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </Card>

          {/* Items Section */}
          {debt.items && debt.items.length > 0 && (
            <Card style={styles.itemsCard}>
              <Text style={styles.sectionTitle}>Items</Text>
              
              {debt.items
                .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())
                .map((item, index) => (
                  <View key={item.id} style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemDescription}>{item.description}</Text>
                    </View>
                    
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
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
              <Text style={styles.sectionTitle}>Payment History</Text>
              
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
                          <Text style={styles.paymentAmount}>
                            {parseFloat(payment.amount).toLocaleString()} RWF
                          </Text>
                          <View style={[
                            styles.paymentStatus,
                            { backgroundColor: payment.confirmedByIssuer ? colors.success + '20' : colors.warning + '20' }
                          ]}>
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
                          <InputPin
                            label="Enter PIN to confirm"
                            value={pinForApproval}
                            onChange={setPinForApproval}
                          />
                          <Button
                            title="Confirm Payment"
                            onPress={() => handleConfirmPayment(payment.id)}
                            loading={confirmPaymentMutation.isPending}
                            style={styles.confirmPaymentButton}
                            disabled={!pinForApproval || pinForApproval.length < 4}
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
              <Text style={styles.sectionTitle}>Actions</Text>

              {/* Pay Debt Form */}
              {canPay && (
                <View style={styles.actionSection}>
                  <Text style={styles.actionSectionTitle}>Make Payment</Text>
                  <Input
                    label="Payment Amount"
                    value={paymentAmount}
                    onChangeText={setPaymentAmount}
                    keyboardType="numeric"
                    placeholder={`Max: ${(() => {
                      const confirmedPaymentsTotal = payments
                        ?.filter(p => p.confirmedByIssuer)
                        ?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
                      const remainingAmount = parseFloat(debt.amount) - confirmedPaymentsTotal;
                      return remainingAmount.toLocaleString();
                    })()} RWF`}
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
                  <Text style={styles.actionSectionTitle}>Approve Debt</Text>
                  <InputPin
                    label="Enter your PIN to approve"
                    value={pinForApproval}
                    onChange={setPinForApproval}
                  />
                  <View style={styles.buttonGroup}>
                    <View style={{ flex: 1, marginRight: 4 }}>
                      <Button
                        title="Approve"
                        onPress={handleApprove}
                        loading={approveDebtMutation.isPending}
                        style={styles.actionButton}
                        disabled={!pinForApproval || pinForApproval.length < 4}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 4 }}>
                      <Button
                        title="Reject"
                        onPress={handleReject}
                        variant="outline"
                        loading={rejectDebtMutation.isPending}
                        style={styles.actionButton}
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* Confirm Payment */}
              {canConfirm && (
                <View style={styles.actionSection}>
                  <Text style={styles.actionSectionTitle}>Confirm Payment</Text>
                  <InputPin
                    label="Enter your PIN to confirm payment"
                    value={pinForApproval}
                    onChange={setPinForApproval}
                  />
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
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) =>
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
    content: {
      flex: 1,
      padding: Spacing.lg,
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
    amount: {
      fontSize: 36,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginLeft: Spacing.sm,
    },
    statusBadge: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: 16,
      marginTop: Spacing.sm,
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
    progressLabel: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
      color: colors.textSecondary,
      marginBottom: Spacing.sm,
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
    sectionTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-SemiBold',
      color: colors.text,
      marginBottom: Spacing.md,
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    detailContent: {
      marginLeft: Spacing.md,
      flex: 1,
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
      marginLeft: 'auto',
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
    actionSectionTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-SemiBold',
      marginBottom: Spacing.md,
      color: colors.text,
    },
    buttonGroup: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: Spacing.md,
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
    paymentAmount: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
    },
    paymentStatus: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: 12,
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
  });
