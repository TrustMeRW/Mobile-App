import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorModal } from '@/components/ui/ErrorModal';
import { Spacing, Typography } from '@/constants/theme';
import { apiClient } from '@/services/api';

export default function SubscribeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { planId } = useLocalSearchParams();
  const [msisdn, setMsisdn] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'MTN' | 'AIRTEL'>('MTN');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { data: plan, isLoading: loadingPlan } = useQuery<
    any,
    Error,
    any,
    [string, string | string[]]
  >({
    queryKey: ['subscription-model', planId],
    queryFn: async () => {
      const res = await apiClient.get(`/subscriptions/models/${planId}`);
      return res.payload;
    },
    enabled: !!planId,
  });

  const mutation = useMutation<any, Error, void, unknown>({
    mutationFn: async () => {
      if (!msisdn.match(/^07[0-9]{8}$/)) {
        throw new Error('Enter a valid Rwandan phone number (07XXXXXXXX)');
      }
      if (!planId) {
        throw new Error('Subscription plan not found');
      }
      // Backend expects: subscriptionModelId, msisdn, paymentMethod
      return apiClient.post('/payments/subscribe', {
        subscriptionModelId: planId,
        msisdn,
        paymentMethod,
      });
    },
    onSuccess: (data: any) => {
      router.push({
        pathname: '/(payments)/status/[trxRef]',
        params: { trxRef: data.payload.trxRef },
      });
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to initiate payment');
      setShowErrorModal(true);
    },
  });

  if (loadingPlan)
    return (
      <View style={styles.centered}>
        <Text>Loading...</Text>
      </View>
    );
  if (!plan)
    return (
      <View style={styles.centered}>
        <Text>Plan not found</Text>
      </View>
    );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Card style={styles.card}>
        <Text style={styles.title}>Subscribe to {plan?.name}</Text>
        <Text style={styles.price}>
          RWF {plan?.amount?.toLocaleString?.() || plan?.amount} /{' '}
          {plan?.duration} days
        </Text>
        <Text style={styles.desc}>{plan?.description}</Text>
        <Input
          label="Phone Number (MoMo)"
          value={msisdn}
          onChangeText={setMsisdn}
          placeholder="07XXXXXXXX"
          keyboardType="phone-pad"
          style={styles.input}
        />
        <View style={styles.methodRow}>
          <Button
            title="MTN"
            variant={paymentMethod === 'MTN' ? 'primary' : 'secondary'}
            onPress={() => setPaymentMethod('MTN')}
            style={styles.methodBtn}
          />
          <Button
            title="AIRTEL"
            variant={paymentMethod === 'AIRTEL' ? 'primary' : 'secondary'}
            onPress={() => setPaymentMethod('AIRTEL')}
            style={styles.methodBtn}
          />
        </View>
        <Button
          title={mutation.isPending ? 'Processing...' : 'Pay & Subscribe'}
          onPress={() => mutation.mutate()}
          style={styles.payBtn}
          disabled={mutation.isPending}
        />
      </Card>

      {/* Error Modal */}
      <ErrorModal
        isVisible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Payment Error"
        message={errorMessage}
      />
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
  price: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Medium',
    marginBottom: Spacing.sm,
  },
  desc: {
    fontSize: Typography.fontSize.sm,
    color: '#888',
    marginBottom: Spacing.md,
  },
  input: {
    marginBottom: Spacing.md,
  },
  methodRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  methodBtn: {
    flex: 1,
    marginHorizontal: Spacing.sm / 2,
  },
  payBtn: {
    marginTop: Spacing.md,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
