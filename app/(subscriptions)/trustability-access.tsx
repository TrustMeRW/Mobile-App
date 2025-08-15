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

// Define a type for the trustability access response
interface TrustabilityAccess {
  canViewTrustability: boolean;
  usage: number;
  maxViews: number;
}

export default function TrustabilityAccessScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { data, isLoading, error, refetch } = useQuery<
    TrustabilityAccess | null,
    Error
  >({
    queryKey: ['trustability-access'],
    queryFn: async () => {
      const res = await apiClient.get<any>(
        '/subscriptions/trustability-access'
      );
      if (!res.payload) return null;
      return res.payload;
    },
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: colors.error }}>Failed to fetch access</Text>
      </View>
    );
  }
  if (!data) {
    return (
      <View style={styles.centered}>
        <Text>No data</Text>
      </View>
    );
  }

  const canViewTrustability = data.canViewTrustability;
  const usage = data.usage;
  const maxViews = data.maxViews;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Card style={styles.card}>
        <Text style={styles.title}>Trustability Access</Text>
        <Text style={styles.status}>
          {canViewTrustability ? 'Access Granted' : 'No Access'}
        </Text>
        <Text style={styles.desc}>
          {canViewTrustability
            ? `You have used ${usage} of ${maxViews} trustability views this month.`
            : 'Upgrade your subscription to access trustability features.'}
        </Text>
        {!canViewTrustability && (
          <Button
            title="View Plans"
            onPress={() => router.push('/(subscriptions)')}
            style={styles.btn}
          />
        )}
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
