import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Spacing, Typography } from '@/constants/theme';

export default function SubscriptionHistoryScreen() {
  const { colors } = useTheme();
  const { data, isLoading, error } = useQuery({
    queryKey: ['subscription-history'],
    queryFn: async () => {
      const res: { payload?: { data?: any[] } } = await apiClient.get('/subscriptions/my-subscription/history');
      return res.payload?.data || [];
    },
  });

  const historyData = Array.isArray(data) ? data : [];

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
        <Text style={{ color: colors.error }}>Failed to fetch history</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={historyData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.lg }}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Text style={styles.title}>{item.subscriptionModel?.name}</Text>
            <Text style={styles.status}>{item.status}</Text>
            <Text style={styles.desc}>
              From:{' '}
              {item.startedAt
                ? new Date(item.startedAt).toLocaleDateString()
                : 'N/A'}
            </Text>
            <Text style={styles.desc}>
              To:{' '}
              {item.expiresAt
                ? new Date(item.expiresAt).toLocaleDateString()
                : 'N/A'}
            </Text>
          </Card>
        )}
        ListEmptyComponent={
          <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
            No history found.
          </Text>
        }
      />
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
  status: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Medium',
    marginBottom: Spacing.sm,
  },
  desc: {
    fontSize: Typography.fontSize.sm,
    color: '#888',
    marginBottom: Spacing.sm,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
