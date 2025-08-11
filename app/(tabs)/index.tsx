import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Button, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { useAuthContext } from '@/contexts/AuthContext';
import Toast from 'react-native-toast-message';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { apiClient } from '@/services/api';
import { MotiView } from 'moti';
import { Plus, DollarSign, TrendingUp, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle } from 'lucide-react-native';

import type { Debt as ApiDebt, PaginatedResponse } from '@/services/api';

interface Debt extends Omit<ApiDebt, 'status'> {
  status: 'ACTIVE' | 'COMPLETED' | 'OVERDUE' | 'PAID_PENDING_CONFIRMATION' | 'PENDING' | 'REJECTED';
}

interface Stats {
  totalDebtAmount: number;
  totalPaid: number;
  activeDebts: number;
  overdueDebts: number;
  totalDebts: number;
}

export default function HomeScreen() {
  const { user } = useAuthContext();
  
  const handleDebugPress = async () => {
    try {
      console.log('=== Starting Debug ===');
      const token = await SecureStore.getItemAsync('access_token');
      console.log('Access Token:', token);
      
      const response = await fetch('https://trustme-xxko.onrender.com/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      console.log('Profile API Response:', data);
      
      // Test debts API
      const debts = await apiClient.getDebtsRequested();
      console.log('Debts Requested:', debts);
      
      Toast.show({
        type: 'success',
        text1: 'Debug Success',
        text2: 'Check console for details',
      });
      
      return data;
    } catch (error) {
      console.error('Debug Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Debug Failed',
        text2: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  };
  
  useEffect(() => {
    // Debug: Log auth status on mount
    const checkAuth = async () => {
      const token = await SecureStore.getItemAsync('access_token');
      console.log('HomeScreen Mounted - Auth Token:', token ? 'Found' : 'Not Found');
    };
    checkAuth();
  }, []);

  const { data: debtsRequested, isLoading: loadingRequested, refetch: refetchRequested } = useQuery<PaginatedResponse<Debt>>({
    queryKey: ['debts-requested'],
    queryFn: () => apiClient.getDebtsRequested(),
  });

  const { data: debtsOffered, isLoading: loadingOffered, refetch: refetchOffered } = useQuery<PaginatedResponse<Debt>>({
    queryKey: ['debts-offered'],
    queryFn: () => apiClient.getDebtsOffered(),
  });

  const isLoading = loadingRequested || loadingOffered;

  const handleRefresh = async () => {
    await Promise.all([refetchRequested(), refetchOffered()]);
  };

  const calculateStats = (): Stats => {
    const requestedDebts = debtsRequested?.data || [];
    const offeredDebts = debtsOffered?.data || [];
    const allDebts: Debt[] = [...requestedDebts, ...offeredDebts];

    const totalDebtAmount = allDebts
      .filter((debt) => debt.status === 'ACTIVE')
      .reduce((sum, debt) => sum + parseFloat(debt.amount || '0'), 0);

    const totalPaid = allDebts.reduce(
      (sum, debt) => sum + parseFloat(debt.amountPaid || '0'), 
      0
    );

    const activeDebts = allDebts.filter(
      (debt) => debt.status === 'ACTIVE' || debt.status === 'PAID_PENDING_CONFIRMATION'
    ).length;

    const overdueDebts = allDebts.filter((debt) => debt.status === 'OVERDUE').length;

    return { 
      totalDebtAmount,
      totalPaid,
      activeDebts,
      overdueDebts,
      totalDebts: allDebts.length
    };
  };

  const stats = calculateStats();

  const recentTransactions = [
    ...(debtsRequested?.data || []),
    ...(debtsOffered?.data || [])
  ]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5) as Debt[];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      >
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
        >
          <View style={styles.header}>
            <Text style={styles.greeting}>Hello, {user?.firstName}!</Text>
            <Text style={styles.subGreeting}>Here's your debt overview</Text>
          </View>

          <View style={styles.statsGrid}>
            <MotiView
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 600, delay: 100 }}
              style={styles.statCard}
            >
              <Card style={styles.primaryCard}>
                <View style={styles.statContent}>
                  <DollarSign color={Colors.white} size={24} />
                  <Text style={styles.statValue}>{(stats.totalDebtAmount-stats.totalPaid).toLocaleString()}RWF</Text>
                  <Text style={styles.statLabelDebt}>Total Debt</Text>
                </View>
              </Card>
            </MotiView>

            <MotiView
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 600, delay: 200 }}
              style={styles.statCard}
            >
              <Card>
                <View style={styles.statContent}>
                  <TrendingUp color={Colors.success} size={24} />
                  <Text style={[styles.statValue, { color: Colors.dark }]}>
                    {stats.totalPaid.toLocaleString()}RWF
                  </Text>
                  <Text style={styles.statLabel}>Total Paid</Text>
                </View>
              </Card>
            </MotiView>

            <MotiView
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 600, delay: 300 }}
              style={styles.statCard}
            >
              <Card>
                <View style={styles.statContent}>
                  <CheckCircle color={Colors.info} size={24} />
                  <Text style={[styles.statValue, { color: Colors.dark }]}>
                    {stats.activeDebts}
                  </Text>
                  <Text style={styles.statLabel}>Active Debts</Text>
                </View>
              </Card>
            </MotiView>

            <MotiView
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 600, delay: 400 }}
              style={styles.statCard}
            >
              <Card>
                <View style={styles.statContent}>
                  <AlertTriangle color={Colors.error} size={24} />
                  <Text style={[styles.statValue, { color: Colors.dark }]}>
                    {stats.overdueDebts}
                  </Text>
                  <Text style={styles.statLabel}>Overdue</Text>
                </View>
              </Card>
            </MotiView>
          </View>

          <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600, delay: 500 }}
          >
            <Card style={styles.recentSection}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              {recentTransactions.length > 0 ? (
                recentTransactions.map((debt, index) => (
                  <View key={debt.id} style={styles.transactionItem}>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionTitle}>
                        {debt.initiationType === 'REQUESTED' ? 'Debt Request' : 'Debt Offer'}
                      </Text>
                      <Text style={styles.transactionAmount}>
                        ${debt.amount.toLocaleString()}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, getStatusBadgeStyle(debt.status)]}>
                      <Text style={[styles.statusText, getStatusTextStyle(debt.status)]}>
                        {debt.status}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No recent activity</Text>
              )}
            </Card>
          </MotiView>
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
    backgroundColor: Colors.gray[50],
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  greeting: {
    fontSize: Typography.fontSize.xxxl,
    fontFamily: 'DMSans-Bold',
    color: Colors.dark,
  },
  subGreeting: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Regular',
    color: Colors.gray[600],
    marginTop: Spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statCard: {
    width: '48%',
    marginRight: '2%',
    marginBottom: Spacing.md,
  },
  primaryCard: {
    backgroundColor: Colors.primary,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  statValue: {
    fontSize: Typography.fontSize.xl,
    fontFamily: 'DMSans-Bold',
    color: Colors.white,
    marginTop: Spacing.sm,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Medium',
    color: Colors.dark,
    opacity: 0.9,
    marginTop: Spacing.xs,
  },
  statLabelDebt: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Medium',
    color: Colors.white,
    opacity: 0.9,
    marginTop: Spacing.xs,
  },
  recentSection: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: 'DMSans-SemiBold',
    color: Colors.dark,
    marginBottom: Spacing.md,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Medium',
    color: Colors.dark,
  },
  transactionAmount: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Regular',
    color: Colors.gray[600],
    marginTop: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: 'DMSans-SemiBold',
    textTransform: 'uppercase',
  },
  emptyText: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Regular',
    color: Colors.gray[500],
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
});