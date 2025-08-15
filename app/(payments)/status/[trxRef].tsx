import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spacing, Typography } from '@/constants/theme';
import { apiClient } from '@/services/api';

export default function PaymentStatusScreen() {
  const { colors } = useTheme();
  const { trxRef } = useLocalSearchParams();
  const router = useRouter();
  const { data, isLoading, error, refetch } = useQuery<
    any,
    Error,
    any,
    [string, string | string[]]
  >({
    queryKey: ['payment-status', trxRef],
    queryFn: async () => {
      const res = await apiClient.get(`/payments/status/${trxRef}`);
      return res.payload;
    },
    enabled: !!trxRef,
    refetchInterval: 5000,
  });

  if (isLoading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  if (error)
    return (
      <View style={styles.centered}>
        <Text style={{ color: colors.error }}>
          Failed to fetch payment status
        </Text>
      </View>
    );
  if (!data)
    return (
      <View style={styles.centered}>
        <Text>No payment found</Text>
      </View>
    );

  const status = data?.status;
  const message = data?.message;
  const isSubscriptionCreated = data?.isSubscriptionCreated;
  const isSuccess = status === 'SUCCESSFUL' && isSubscriptionCreated;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Card style={styles.card}>
        <Text style={styles.title}>Payment Status</Text>
        <Text
          style={[
            styles.status,
            { color: isSuccess ? colors.success : colors.error },
          ]}
        >
          {status}
        </Text>
        <Text style={styles.desc}>
          {message ||
            (isSuccess
              ? 'Subscription activated!'
              : 'Payment failed or pending.')}
        </Text>
        <Button
          title="Go to Subscriptions"
          onPress={() => router.replace('/(subscriptions)')}
          style={styles.btn}
        />
        <Button
          title="Retry"
          onPress={() => refetch()}
          style={styles.btn}
          variant="secondary"
        />
      </Card>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontFamily: 'DMSans-Bold',
    marginBottom: Spacing.sm,
  },
  status: {
    fontSize: Typography.fontSize.xl,
    fontFamily: 'DMSans-Bold',
    marginBottom: Spacing.md,
  },
  desc: {
    fontSize: Typography.fontSize.md,
    color: '#888',
    marginBottom: Spacing.md,
  },
  btn: {
    marginTop: Spacing.sm,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
