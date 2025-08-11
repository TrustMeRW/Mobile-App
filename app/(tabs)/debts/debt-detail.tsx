import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { apiClient } from '@/services/api';

type ExtendedDebt = {
  id: string;
  amount: string;
  amountPaid: string;
  paymentDate: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'PAID_PENDING_CONFIRMATION' | 'OVERDUE' | 'REJECTED';
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
};
import { useAuthContext } from '@/contexts/AuthContext';
import Toast from 'react-native-toast-message';
import { MotiView } from 'moti';
import { ChevronLeft, DollarSign, Calendar, User, CircleCheck as CheckCircle, Circle as XCircle, CreditCard } from 'lucide-react-native';

export default function DebtDetailScreen() {
  // All hooks must be called unconditionally at the top level
  const params = useLocalSearchParams();
  const id = params.id as string;
  const { user } = useAuthContext();
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('MOBILE_MONEY');
  const [pinForApproval, setPinForApproval] = useState('');
  const [isLoadingDebt, setIsLoadingDebt] = useState(true);
  const [debt, setDebt] = useState<ExtendedDebt | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();

  // Mutations must be called at the top level
  const payDebtMutation = useMutation({
    mutationFn: (data: { amount: string; paymentMethod: string }) => {
      return apiClient.payDebt(id as string, parseFloat(data.amount), data.paymentMethod);
    },
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Payment Successful',
        text2: 'Your payment has been recorded.',
      });
      queryClient.invalidateQueries({ queryKey: ['debt', id] });
      queryClient.invalidateQueries({ queryKey: ['debts'] });
    },
    onError: (err: any) => {
      const errorMessage = err?.response?.data?.message || 'An error occurred during payment.';
      Toast.show({
        type: 'error',
        text1: 'Payment Failed',
        text2: errorMessage,
      });
    },
  });

  const approveDebtMutation = useMutation({
    mutationFn: (data: { debtId: string; pin: string }) => apiClient.approveDebt(data.debtId, data.pin),
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Debt Approved',
        text2: 'You have successfully approved the debt.',
      });
      queryClient.invalidateQueries({ queryKey: ['debt', id] });
      queryClient.invalidateQueries({ queryKey: ['debts'] });
    },
    onError: (err: any) => {
      const errorMessage = err?.response?.data?.message || 'An error occurred while approving the debt.';
      Toast.show({
        type: 'error',
        text1: 'Approval Failed',
        text2: errorMessage,
      });
    },
  });

  const rejectDebtMutation = useMutation({
    mutationFn: apiClient.rejectDebt,
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Debt Rejected',
        text2: 'You have successfully rejected the debt.',
      });
      queryClient.invalidateQueries({ queryKey: ['debt', id] });
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      router.back();
    },
    onError: (err: any) => {
      const errorMessage = err?.response?.data?.message || 'An error occurred while rejecting the debt.';
      Toast.show({
        type: 'error',
        text1: 'Rejection Failed',
        text2: errorMessage,
      });
    },
  });

  const confirmPaidMutation = useMutation({
    mutationFn: (data: { debtId: string; pin: string }) => apiClient.confirmDebtPayment(data.debtId, data.pin),
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Payment Confirmed',
        text2: 'You have successfully confirmed the payment.',
      });
      queryClient.invalidateQueries({ queryKey: ['debt', id] });
      queryClient.invalidateQueries({ queryKey: ['debts'] });
    },
    onError: (err: any) => {
      const errorMessage = err?.response?.data?.message || 'An error occurred while confirming payment.';
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
        const transformedDebt: ExtendedDebt = {
          id: debtData.id,
          amount: debtData.amount,
          amountPaid: debtData.amountPaid || '0',
          paymentDate: debtData.paymentDate || '',
          status: debtData.status,
          requester: debtData.requester,
          issuer: debtData.issuer,
          createdAt: debtData.createdAt,
          updatedAt: debtData.updatedAt,
        };
        
        setDebt(transformedDebt);
        setError(null);
      } catch (err) {
        console.error('Error fetching debt details:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load debt details';
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
    const remainingAmount = parseFloat(debt.amount) - parseFloat(debt.amountPaid || '0');
    if (amount > remainingAmount) {
      Toast.show({
        type: 'error',
        text1: 'Amount Too High',
        text2: 'Payment amount cannot exceed remaining debt',
      });
      return;
    }

    payDebtMutation.mutate({ amount: paymentAmount, paymentMethod });
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
          onPress: () => rejectDebtMutation.mutate(id as string) 
        },
      ]
    );
  };

  const handleConfirmPaid = () => {
    Alert.alert(
      'Confirm Payment',
      'Are you sure you want to confirm this payment? This will mark the debt as paid.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: () => confirmPaidMutation.mutate({
            debtId: id,
            pin: pinForApproval,
          }) 
        },
      ]
    );
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

  const { requester, issuer, amount, amountPaid, status, paymentDate, createdAt } = debt;
  const isRequester = user?.id === requester.id;
  const isIssuer = user?.id === issuer.id;
  
  // Determine available actions based on user role and debt status
  const canPay = isRequester && (status === 'ACTIVE' || status === 'OVERDUE');
  const canApprove = !isRequester && status === 'PENDING';
  const canReject = (isRequester || isIssuer) && status === 'PENDING';
  const canConfirm = isIssuer && status === 'PAID_PENDING_CONFIRMATION';
  const canViewActions = canPay || canApprove || canReject || canConfirm;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color={Colors.dark} size={24} />
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
              <Text style={styles.amount}>{debt.amount.toLocaleString()}RWF</Text>
            </View>
            
            <View style={[styles.statusBadge, getStatusBadgeStyle(debt.status)]}>
              <Text style={[styles.statusText, getStatusTextStyle(debt.status)]}>
                {debt.status}
              </Text>
            </View>

            {parseFloat(debt.amountPaid || '0') > 0 && (
              <View style={styles.progressSection}>
                <Text style={styles.progressLabel}>Payment Progress</Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { width: `${(parseFloat(debt.amountPaid || '0') / parseFloat(debt.amount)) * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {parseFloat(debt.amountPaid || '0').toLocaleString()}RWF of {parseFloat(debt.amount).toLocaleString()}RWF
                </Text>
              </View>
            )}
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
                    : `${debt.requester.firstName} ${debt.requester.lastName}`
                  }
                </Text>
              </View>
            </View>
            
            <View style={styles.detailItem}>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Status</Text>
                <View style={[styles.statusBadge, getStatusBadgeStyle(status)]}>
                  <Text style={[styles.statusText, getStatusTextStyle(status)]}>
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
                    placeholder={`Max: ${(parseFloat(debt.amount) - parseFloat(debt.amountPaid || '0')).toLocaleString()} RWF`}
                  />

                  <View style={styles.paymentMethods}>
                    <Text style={styles.methodLabel}>Payment Method</Text>
                    <View style={styles.paymentMethodOptions}>
                      {['MOBILE_MONEY', 'BANK_TRANSFER', 'CASH'].map((method) => (
                        <TouchableOpacity
                          key={method}
                          onPress={() => setPaymentMethod(method)}
                          style={[
                            styles.methodButton,
                            paymentMethod === method && styles.methodButtonActive,
                          ]}
                        >
                          <Text style={[
                            styles.methodText,
                            paymentMethod === method && styles.methodTextActive,
                          ]}>
                            {method.replace('_', ' ')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <Button
                    title="Submit Payment"
                    onPress={handlePayment}
                    loading={payDebtMutation.isPending}
                    style={styles.actionButton}
                    disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                  />
                </View>
              )}

              {/* Approve Debt */}
              {canApprove && (
                <View style={styles.actionSection}>
                  <Text style={styles.actionSectionTitle}>Approve Debt</Text>
                  <Input
                    label="Enter your PIN to approve"
                    value={pinForApproval}
                    onChangeText={setPinForApproval}
                    secureTextEntry
                    keyboardType="numeric"
                    maxLength={6}
                    placeholder="Enter 4-6 digit PIN"
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
                  <Input
                    label="Enter your PIN to confirm payment"
                    value={pinForApproval}
                    onChangeText={setPinForApproval}
                    secureTextEntry
                    keyboardType="numeric"
                    maxLength={6}
                    placeholder="Enter 4-6 digit PIN"
                  />
                  <Button
                    title="Confirm Payment Received"
                    onPress={handleConfirmPaid}
                    loading={confirmPaidMutation.isPending}
                    style={styles.actionButton}
                    disabled={!pinForApproval || pinForApproval.length < 4}
                  />
                </View>
              )}

              {/* Reject Action (when not in approve flow) */}
              {canReject && !canApprove && (
                <View style={styles.actionSection}>
                  <Text style={styles.actionSectionTitle}>Debt Actions</Text>
                  <Button
                    title="Reject Debt"
                    onPress={handleReject}
                    variant="outline"
                    loading={rejectDebtMutation.isPending}
                    style={styles.actionButton}
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

const getStatusBadgeStyle = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return { backgroundColor: Colors.success + '20' };
    case 'PENDING':
      return { backgroundColor: Colors.warning + '20' };
    case 'OVERDUE':
      return { backgroundColor: Colors.error + '20' };
    case 'COMPLETED':
      return { backgroundColor: Colors.info + '20' };
    case 'PAID_PENDING_CONFIRMATION':
      return { backgroundColor: Colors.primary + '20' };
    default:
      return { backgroundColor: Colors.gray[100] };
  }
};

const getStatusTextStyle = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return { color: Colors.success };
    case 'PENDING':
      return { color: Colors.warning };
    case 'OVERDUE':
      return { color: Colors.error };
    case 'COMPLETED':
      return { color: Colors.info };
    case 'PAID_PENDING_CONFIRMATION':
      return { color: Colors.primary };
    default:
      return { color: Colors.gray[600] };
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Regular',
    color: Colors.gray[600],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  errorText: {
    fontSize: Typography.fontSize.xl,
    fontFamily: 'DMSans-Bold',
    color: Colors.error,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  backButton: {
    marginTop: Spacing.lg,
    width: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontFamily: 'DMSans-Bold',
    color: Colors.dark,
    marginLeft: Spacing.md,
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  amountCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  amountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  amount: {
    fontSize: 36,
    fontFamily: 'DMSans-Bold',
    color: Colors.dark,
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
    color: Colors.gray[600],
    marginBottom: Spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Regular',
    color: Colors.gray[600],
    textAlign: 'center',
  },
  detailsCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: 'DMSans-SemiBold',
    color: Colors.dark,
    marginBottom: Spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  detailContent: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  detailLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Medium',
    color: Colors.gray[600],
  },
  detailValue: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Regular',
    color: Colors.dark,
    marginLeft: 'auto',
  },
  actionCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentMethods: {
    marginBottom: Spacing.lg,
  },
  methodLabel: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Medium',
    color: Colors.dark,
    marginBottom: Spacing.sm,
  },
  methodButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.gray[300],
    marginBottom: Spacing.sm,
  },
  methodButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  methodText: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Medium',
    color: Colors.gray[600],
    textAlign: 'center',
  },
  methodTextActive: {
    color: Colors.white,
  },
  actionSection: {
    marginBottom: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  actionSectionTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-SemiBold',
    marginBottom: Spacing.md,
    color: Colors.gray[700],
  },
  paymentMethodOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  actionButton: {
    marginTop: Spacing.md,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  approveButton: {
    flex: 1,
  },
  rejectButton: {
    flex: 1,
  },
  confirmText: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Regular',
    color: Colors.gray[600],
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
});