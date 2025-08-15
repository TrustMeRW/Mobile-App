import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spacing, Typography } from '@/constants/theme';
import { useRouter } from 'expo-router';

// Define a type for the subscription response
interface MySubscription {
  status: string;
  expiresAt?: string;
  subscriptionModel?: { name: string };
}

export default function MySubscriptionScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { data, isLoading, error, refetch } = useQuery<
    MySubscription | null,
    Error
  >({
    queryKey: ['my-subscription'],
    queryFn: async () => {
      const res = await apiClient.get<any>('/subscriptions/my-subscription');
      if (!res.payload) return null;
      return res.payload;
    },
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
          Failed to fetch subscription
        </Text>
      </View>
    );
  if (!data)
    return (
      <View style={styles.centered}>
        <Text>No active subscription</Text>
      </View>
    );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Card style={styles.card}>
        <Text style={styles.title}>My Subscription</Text>
        <Text style={styles.status}>{data?.status || 'N/A'}</Text>
        <Text style={styles.desc}>{data?.subscriptionModel?.name || ''}</Text>
        <Text style={styles.desc}>
          Valid until:{' '}
          {data?.expiresAt
            ? new Date(data.expiresAt).toLocaleDateString()
            : 'N/A'}
        </Text>
        <Button
          title="View Plans"
          onPress={() => router.push('/(subscriptions)')}
          style={styles.btn}
        />
        <Button
          title="Refresh"
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
