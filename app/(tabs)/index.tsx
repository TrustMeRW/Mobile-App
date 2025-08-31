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
import { useCurrentUser, useDebts, usePersonalTrustabilityAnalytics } from '@/hooks';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Typography, Spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/contexts/TranslationContext';
import { apiClient } from '@/services/api';
import { MotiView } from 'moti';
import {
  DollarSign,
  TrendingUp,
  TriangleAlert as AlertTriangle,
  CircleCheck as CheckCircle,
  Shield,
  Target,
  MapPin,
} from 'lucide-react-native';
import { NotificationBell } from '@/components/NotificationBell';

import type { Debt as ApiDebt, PaginatedResponse, TrustabilityAnalytics } from '@/services/api';

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
  const { t } = useTranslation();
  const styles = getStyles(colors);
  const { user, isLoading: userLoading, refetch: refetchUser } = useCurrentUser();

  const {
    data: myDebts,
    isLoading: loadingMyDebts,
    refetch: refetchMyDebts,
  } = useDebts({
    includeRequested: true,
    includeOffered: true
  });

  const {
    data: trustabilityAnalytics,
    isLoading: loadingTrustability,
    refetch: refetchTrustability,
  } = usePersonalTrustabilityAnalytics();

  const isLoading = loadingMyDebts || userLoading || loadingTrustability;

  const handleRefresh = async () => {
    await Promise.all([
      refetchMyDebts(),
      refetchUser(),
      refetchTrustability(),
    ]);
  };

  const calculateStats = (): Stats => {
    const allDebts: Debt[] = myDebts?.data || [];
    console.log('All debts:', allDebts);

    const totalDebtAmount = allDebts
      .filter((debt) => debt.status === 'ACTIVE')
      .reduce((sum, debt) => sum + parseFloat(debt.amount || '0'), 0);
console.log(totalDebtAmount)
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

  const recentTransactions = (myDebts?.data || [])
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
              <Text style={styles.greeting}>{t('home.greeting', { name: user?.firstName || 'User' })}</Text>
              <Text style={styles.subGreeting}>{t('home.subGreeting')}</Text>
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
              <View style={styles.primaryCard}>
                <View style={styles.statContent}>
                  <DollarSign color={colors.primary} size={24} />
                  <Text style={styles.statValue}>
                    {(stats.totalDebtAmount).toLocaleString()}
                    RWF
                  </Text>
                  <Text style={styles.statLabelDebt}>{t('home.totalDebt')}</Text>
                </View>
              </View>
            </MotiView>

            <MotiView
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 600, delay: 200 }}
              style={styles.statCard}
            >
              <View>
                <View style={styles.statContent}>
                  <TrendingUp color={colors.success} size={24} />
                  <Text style={styles.statValue}>
                    {stats.totalPaid.toLocaleString()}RWF
                  </Text>
                  <Text style={styles.statLabel}>{t('home.totalPaid')}</Text>
                </View>
              </View>
            </MotiView>

            <MotiView
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 600, delay: 300 }}
              style={styles.statCard}
            >
              <View>
                <View style={styles.statContent}>
                  <CheckCircle color={colors.info} size={24} />
                  <Text style={styles.statValue}>{stats.activeDebts}</Text>
                  <Text style={styles.statLabel}>{t('home.activeDebts')}</Text>
                </View>
              </View>
            </MotiView>

            <MotiView
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 600, delay: 400 }}
              style={styles.statCard}
            >
              <View>
                <View style={styles.statContent}>
                  <AlertTriangle color={colors.error} size={24} />
                  <Text style={styles.statValue}>{stats.overdueDebts}</Text>
                  <Text style={styles.statLabel}>{t('home.overdueDebts')}</Text>
                </View>
              </View>
            </MotiView>
          </View>

          {/* Trustability Analytics Section */}
          {trustabilityAnalytics?.payload && (
            <MotiView
              from={{ opacity: 0, translateY: 30 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 600, delay: 450 }}
            >
              <View style={styles.trustabilitySection}>
                <Text style={styles.sectionTitle}>{t('home.trustabilityAnalytics')}</Text>
                <View style={styles.trustabilityCard}>
                  <View style={styles.trustabilityHeader}>
                    <Shield color={colors.primary} size={24} />
                    <Text style={styles.trustabilityTitle}>{t('home.trustScore')}</Text>
                  </View>
                  <View style={styles.trustabilityScore}>
                    <Text style={styles.trustabilityPercentage}>
                      {trustabilityAnalytics.payload.trustabilityPercentage}%
                    </Text>
                    <Text style={styles.trustabilityLabel}>{t('home.trustabilityScore')}</Text>
                  </View>
                  
                  <View style={styles.trustabilityStats}>
                    <View style={styles.trustabilityStat}>
                      <Target color={colors.success} size={20} />
                      <Text style={styles.trustabilityStatValue}>
                        {trustabilityAnalytics.payload.possiblePayments}
                      </Text>
                      <Text style={styles.trustabilityStatLabel}>{t('home.possiblePayments')}</Text>
                    </View>
                    <View style={styles.trustabilityStat}>
                      <CheckCircle color={colors.info} size={20} />
                      <Text style={styles.trustabilityStatValue}>
                        {trustabilityAnalytics.payload.completedPayments}
                      </Text>
                      <Text style={styles.trustabilityStatLabel}>{t('home.completed')}</Text>
                    </View>
                    <View style={styles.trustabilityStat}>
                      <TrendingUp color={colors.warning} size={20} />
                      <Text style={styles.trustabilityStatValue}>
                        {trustabilityAnalytics.payload.paymentSuccessRate}%
                      </Text>
                      <Text style={styles.trustabilityStatLabel}>{t('home.successRate')}</Text>
                    </View>
                  </View>

                  <View style={styles.locationInfo}>
                    <MapPin color={colors.textSecondary} size={16} />
                    <Text style={styles.locationText}>
                      {trustabilityAnalytics.payload.location.province}, {trustabilityAnalytics.payload.location.district}
                    </Text>
                  </View>
                </View>
              </View>
            </MotiView>
          )}

          <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600, delay: 500 }}
          >
            <View style={styles.recentSection}>
              <Text style={styles.sectionTitle}>{t('home.recentActivity')}</Text>
              {recentTransactions.length > 0 ? (
                recentTransactions.map((debt) => (
                  <View key={debt.id} style={styles.transactionItem}>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionTitle}>
                        {debt.initiationType === 'REQUESTED'
                          ? t('home.debtRequest')
                          : t('home.debtOffer')}
                      </Text>
                      <Text style={styles.transactionAmount}>
                        {parseInt(debt.amount).toLocaleString()} RWF
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
                <Text style={styles.emptyText}>{t('home.noRecentActivity')}</Text>
              )}
            </View>
          </MotiView>
        </MotiView>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStatusBadgeStyle = (
  status: string,
  colors: any
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
  colors: any
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

const getStyles = (colors: any) =>
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
          backgroundColor: colors.card,
    borderColor: colors.border,
      width: '48%',
      marginRight: '2%',
      marginBottom: Spacing.md,
      height:180,
          borderRadius: Spacing.md,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    },
    primaryCard: {
      // backgroundColor: colors.primary,
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
    trustabilitySection: {
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    trustabilityCard: {
      backgroundColor: colors.card,
      borderRadius: Spacing.md,
      padding: Spacing.lg,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      borderWidth: 1,
      borderColor: colors.border,
    },
    trustabilityHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    trustabilityTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-SemiBold',
      color: colors.text,
      marginLeft: Spacing.sm,
    },
    trustabilityScore: {
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    trustabilityPercentage: {
      fontSize: Typography.fontSize.xxl,
      fontFamily: 'DMSans-Bold',
      color: colors.primary,
      marginBottom: Spacing.xs,
    },
    trustabilityLabel: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
      color: colors.textSecondary,
      opacity: 0.9,
    },
    trustabilityStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: Spacing.md,
    },
    trustabilityStat: {
      alignItems: 'center',
    },
    trustabilityStatValue: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginTop: Spacing.xs,
    },
    trustabilityStatLabel: {
      fontSize: Typography.fontSize.xs,
      fontFamily: 'DMSans-Medium',
      color: colors.textSecondary,
      opacity: 0.9,
      marginTop: Spacing.xs,
    },
    locationInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: Spacing.md,
    },
    locationText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      marginLeft: Spacing.xs,
    },
  });
