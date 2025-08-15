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

// Define a type for payment history item
interface PaymentHistoryItem {
  id: string;
  status: string;
  amount: number;
  createdAt: string;
  trxRef: string;
}

export default function PaymentHistoryScreen() {
  const { colors } = useTheme();
  const { data, isLoading, error } = useQuery<PaymentHistoryItem[], Error>({
    queryKey: ['payment-history'],
    queryFn: async () => {
      const res = await apiClient.get<any>('/payments/history');
      if (Array.isArray(res.payload)) return res.payload;
      if (Array.isArray(res.payload?.data)) return res.payload.data;
      return [];
    },
  });
  const payments = Array.isArray(data) ? data : [];

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
          Failed to fetch payment history
        </Text>
      </View>
    );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={payments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.lg }}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Text style={styles.title}>{item.status}</Text>
            <Text style={styles.amount}>
              RWF {item.amount?.toLocaleString?.() || item.amount}
            </Text>
            <Text style={styles.desc}>
              Date:{' '}
              {item.createdAt
                ? new Date(item.createdAt).toLocaleDateString()
                : 'N/A'}
            </Text>
            <Text style={styles.desc}>Ref: {item.trxRef}</Text>
          </Card>
        )}
        ListEmptyComponent={
          <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
            No payments found.
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
  amount: {
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
