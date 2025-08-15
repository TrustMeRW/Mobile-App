import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/contexts/ThemeContext';
import { apiClient } from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spacing, Typography } from '@/constants/theme';
import { useRouter } from 'expo-router';

export default function SubscriptionsAndPaymentsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  // Fetch current subscription
  const {
    data: subscription,
    isLoading: loadingSub,
    error: subError,
    refetch,
  } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any>('/subscriptions/my-subscription');
        return res.payload;
      } catch (e: any) {
        return null;
      }
    },
  });

  // Fetch trustability access
  const { data: trustability, isLoading: loadingTrust } = useQuery({
    queryKey: ['trustability-access'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any>(
          '/subscriptions/trustability-access'
        );
        return res.payload;
      } catch (e: any) {
        return null;
      }
    },
  });

  // Fetch payment history
  const {
    data: payments,
    isLoading: loadingPayments,
    error: paymentsError,
    refetch: refetchPayments,
  } = useQuery({
    queryKey: ['payment-history'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any>('/payments/history');
        if (Array.isArray(res.payload)) return res.payload;
        if (Array.isArray(res.payload?.data)) return res.payload.data;
        return [];
      } catch (e: any) {
        return [];
      }
    },
  });

  // Fetch subscription history
  const {
    data: subHistory,
    isLoading: loadingSubHistory,
    error: subHistoryError,
    refetch: refetchSubHistory,
  } = useQuery({
    queryKey: ['subscription-history'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any>(
          '/subscriptions/my-subscription/history'
        );
        if (Array.isArray(res.payload)) return res.payload;
        if (Array.isArray(res.payload?.data)) return res.payload.data;
        return [];
      } catch (e: any) {
        return [];
      }
    },
  });

  // Cancel subscription
  const cancelMutation = useMutation({
    mutationFn: async () => {
      setPendingAction('cancel');
      await apiClient.post('/subscriptions/cancel');
    },
    onSuccess: () => {
      setPendingAction(null);
      refetch();
      refetchSubHistory();
      Alert.alert('Subscription cancelled');
    },
    onError: (err: any) => {
      setPendingAction(null);
      Alert.alert('Error', err.message || 'Failed to cancel subscription');
    },
  });

  // Renew subscription
  const renewMutation = useMutation({
    mutationFn: async () => {
      setPendingAction('renew');
      await apiClient.post('/subscriptions/renew');
    },
    onSuccess: () => {
      setPendingAction(null);
      refetch();
      refetchSubHistory();
      Alert.alert('Subscription renewed');
    },
    onError: (err: any) => {
      setPendingAction(null);
      Alert.alert('Error', err.message || 'Failed to renew subscription');
    },
  });

  // Cancel payment
  const cancelPaymentMutation = useMutation({
    mutationFn: async (trxRef: string) => {
      setPendingAction('cancel-payment-' + trxRef);
      await apiClient.post(`/payments/cancel/${trxRef}`);
    },
    onSuccess: () => {
      setPendingAction(null);
      refetchPayments();
      Alert.alert('Payment cancelled');
    },
    onError: (err: any) => {
      setPendingAction(null);
      Alert.alert('Error', err.message || 'Failed to cancel payment');
    },
  });

  // Retry payment
  const retryPaymentMutation = useMutation({
    mutationFn: async (trxRef: string) => {
      setPendingAction('retry-payment-' + trxRef);
      await apiClient.post(`/payments/retry/${trxRef}`);
    },
    onSuccess: () => {
      setPendingAction(null);
      refetchPayments();
      Alert.alert('Payment retry initiated');
    },
    onError: (err: any) => {
      setPendingAction(null);
      Alert.alert('Error', err.message || 'Failed to retry payment');
    },
  });

  const handleSubscribe = () => {
    router.push({ pathname: '/(payments)/subscribe' });
  };

  const handlePaymentStatus = (trxRef: string) => {
    router.push({
      pathname: '/(payments)/status/[trxRef]',
      params: { trxRef },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: Spacing.lg }}>
        <Card style={styles.card}>
          <Text style={styles.title}>Current Subscription</Text>
          {loadingSub ? (
            <ActivityIndicator color={colors.primary} />
          ) : subscription ? (
            <>
              <Text style={styles.price}>
                {subscription.subscriptionModel?.name}
              </Text>
              <Text style={styles.desc}>
                Valid until:{' '}
                {subscription.expiresAt
                  ? new Date(subscription.expiresAt).toLocaleDateString()
                  : 'N/A'}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button
                  title="Cancel"
                  onPress={() => cancelMutation.mutate()}
                  style={styles.button}
                  disabled={pendingAction === 'cancel'}
                  variant="secondary"
                />
                <Button
                  title="Renew"
                  onPress={() => renewMutation.mutate()}
                  style={styles.button}
                  disabled={pendingAction === 'renew'}
                  variant="secondary"
                />
                <Button
                  title="Refresh"
                  onPress={() => refetch()}
                  style={styles.button}
                  variant="secondary"
                />
              </View>
            </>
          ) : (
            <Button
              title="Subscribe"
              onPress={handleSubscribe}
              style={styles.button}
            />
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.title}>Trustability Access</Text>
          {loadingTrust ? (
            <ActivityIndicator color={colors.primary} />
          ) : trustability ? (
            <>
              <Text style={styles.desc}>
                Can view trustability:{' '}
                {trustability.canViewTrustability ? 'Yes' : 'No'}
              </Text>
              <Text style={styles.desc}>
                Usage: {trustability.usage} / {trustability.maxViews}
              </Text>
            </>
          ) : (
            <Text style={styles.desc}>No trustability access info.</Text>
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.title}>Subscription History</Text>
          {loadingSubHistory ? (
            <ActivityIndicator color={colors.primary} />
          ) : subHistory && subHistory.length > 0 ? (
            subHistory.map((item: any) => (
              <View key={item.id} style={styles.historyItem}>
                <Text style={styles.desc}>{item.subscriptionModel?.name}</Text>
                <Text style={styles.desc}>
                  From:{' '}
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString()
                    : 'N/A'}
                </Text>
                <Text style={styles.desc}>
                  To:{' '}
                  {item.expiresAt
                    ? new Date(item.expiresAt).toLocaleDateString()
                    : 'N/A'}
                </Text>
                <Text style={styles.desc}>Status: {item.status}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.desc}>No subscription history found.</Text>
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.title}>Payment History</Text>
          {loadingPayments ? (
            <ActivityIndicator color={colors.primary} />
          ) : payments && payments.length > 0 ? (
            payments.map((item: any) => (
              <View key={item.id} style={styles.historyItem}>
                <TouchableOpacity
                  onPress={() => handlePaymentStatus(item.trxRef)}
                >
                  <Text style={[styles.desc, { color: colors.primary }]}>
                    Ref: {item.trxRef}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.desc}>Status: {item.status}</Text>
                <Text style={styles.desc}>
                  Amount: RWF {item.amount?.toLocaleString?.() || item.amount}
                </Text>
                <Text style={styles.desc}>
                  Date:{' '}
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString()
                    : 'N/A'}
                </Text>
                {['PENDING', 'PROCESSING'].includes(item.status) && (
                  <Button
                    title="Cancel Payment"
                    onPress={() => cancelPaymentMutation.mutate(item.trxRef)}
                    style={styles.button}
                    disabled={pendingAction === 'cancel-payment-' + item.trxRef}
                    variant="secondary"
                  />
                )}
                {['FAILED'].includes(item.status) && (
                  <Button
                    title="Retry Payment"
                    onPress={() => retryPaymentMutation.mutate(item.trxRef)}
                    style={styles.button}
                    disabled={pendingAction === 'retry-payment-' + item.trxRef}
                    variant="secondary"
                  />
                )}
              </View>
            ))
          ) : (
            <Text style={styles.desc}>No payments found.</Text>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontFamily: 'DMSans-Bold',
    marginBottom: Spacing.sm,
  },
  price: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Medium',
    marginBottom: Spacing.sm,
  },
  desc: {
    fontSize: Typography.fontSize.sm,
    color: '#888',
    marginBottom: Spacing.sm,
  },
  button: {
    marginTop: Spacing.sm,
  },
  historyItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: Spacing.sm,
  },
});
