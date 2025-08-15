import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { useAuthContext } from '@/contexts/AuthContext';
import Toast from 'react-native-toast-message';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Typography, Spacing, lightColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { apiClient } from '@/services/api';
import { MotiView } from 'moti';
import {
  DollarSign,
  TrendingUp,
  TriangleAlert as AlertTriangle,
  CircleCheck as CheckCircle,
} from 'lucide-react-native';
import { NotificationBell } from '@/components/NotificationBell';

import type { Debt as ApiDebt, PaginatedResponse } from '@/services/api';

interface Debt extends Omit<ApiDebt, 'status'> {
  status:
    | 'ACTIVE'
    | 'COMPLETED'
    | 'OVERDUE'
    | 'PAID_PENDING_CONFIRMATION'
    | 'PENDING'
    | 'REJECTED';
}

interface Stats {
  totalDebtAmount: number;
  totalPaid: number;
  activeDebts: number;
  overdueDebts: number;
  totalDebts: number;
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { user } = useAuthContext();

  const {
    data: debtsRequested,
    isLoading: loadingRequested,
    refetch: refetchRequested,
  } = useQuery<PaginatedResponse<Debt>>({
    queryKey: ['debts-requested'],
    queryFn: () => apiClient.getDebtsRequested(),
  });

  const {
    data: debtsOffered,
    isLoading: loadingOffered,
    refetch: refetchOffered,
  } = useQuery<PaginatedResponse<Debt>>({
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
      (debt) =>
        debt.status === 'ACTIVE' || debt.status === 'PAID_PENDING_CONFIRMATION'
    ).length;

    const overdueDebts = allDebts.filter(
      (debt) => debt.status === 'OVERDUE'
    ).length;

    return {
      totalDebtAmount,
      totalPaid,
      activeDebts,
      overdueDebts,
      totalDebts: allDebts.length,
    };
  };

  const stats = calculateStats();

  const recentTransactions = [
    ...(debtsRequested?.data || []),
    ...(debtsOffered?.data || []),
  ]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 5) as Debt[];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
          <View
            style={[
              styles.header,
              {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              },
            ]}
          >
            <View>
              <Text style={styles.greeting}>Hello, {user?.firstName}!</Text>
              <Text style={styles.subGreeting}>Here's your debt overview</Text>
            </View>
            <NotificationBell />
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
                  <DollarSign color={colors.white} size={24} />
                  <Text style={styles.statValue}>
                    {(stats.totalDebtAmount).toLocaleString()}
                    RWF
                  </Text>
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
                  <TrendingUp color={colors.success} size={24} />
                  <Text style={styles.statValue}>
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
                  <CheckCircle color={colors.info} size={24} />
                  <Text style={styles.statValue}>{stats.activeDebts}</Text>
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
                  <AlertTriangle color={colors.error} size={24} />
                  <Text style={styles.statValue}>{stats.overdueDebts}</Text>
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
                recentTransactions.map((debt) => (
                  <View key={debt.id} style={styles.transactionItem}>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionTitle}>
                        {debt.initiationType === 'REQUESTED'
                          ? 'Debt Request'
                          : 'Debt Offer'}
                      </Text>
                      <Text style={styles.transactionAmount}>
                        ${debt.amount.toLocaleString()}
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

const getStatusBadgeStyle = (
  status: string,
  colors: typeof lightColors
): ViewStyle => {
  switch (status) {
    case 'ACTIVE':
      return { backgroundColor: colors.success + '20' };
    case 'PENDING':
      return { backgroundColor: colors.warning + '20' };
    case 'OVERDUE':
      return { backgroundColor: colors.error + '20' };
    case 'COMPLETED':
      return { backgroundColor: colors.info + '20' };
    default:
      return { backgroundColor: colors.gray[100] };
  }
};

const getStatusTextStyle = (
  status: string,
  colors: typeof lightColors
): TextStyle => {
  switch (status) {
    case 'ACTIVE':
      return { color: colors.success };
    case 'PENDING':
      return { color: colors.warning };
    case 'OVERDUE':
      return { color: colors.error };
    case 'COMPLETED':
      return { color: colors.info };
    default:
      return { color: colors.gray[600] };
  }
};

const getStyles = (colors: typeof lightColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
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
      color: colors.text,
    },
    subGreeting: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
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
      backgroundColor: colors.primary,
    },
    statContent: {
      alignItems: 'center',
      paddingVertical: Spacing.md,
    },
    statValue: {
      fontSize: Typography.fontSize.xl,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginTop: Spacing.sm,
    },
    statLabel: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
      color: colors.textSecondary,
      opacity: 0.9,
      marginTop: Spacing.xs,
    },
    statLabelDebt: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
      color: colors.white,
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
      color: colors.text,
      marginBottom: Spacing.md,
    },
    transactionItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    transactionInfo: {
      flex: 1,
    },
    transactionTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.text,
    },
    transactionAmount: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
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
      color: colors.textSecondary,
      textAlign: 'center',
      padding: Spacing.lg,
    },
  });
