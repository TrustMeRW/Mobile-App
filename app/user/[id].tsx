import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, TrendingUp, MapPin, Calendar, DollarSign, CheckCircle, XCircle, BarChart3 } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTheme } from '@/contexts/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api';
import {
  Spacing,
  Typography,
  BorderRadius,
} from '@/constants/theme';

interface TrustabilityAnalytics {
  userId: string;
  fullName: string;
  trustabilityPercentage: number;
  possiblePayments: number;
  completedPayments: number;
  paymentSuccessRate: number;
  paymentPatterns: {
    prefersInstallments: boolean;
    installmentPaymentRate: number;
    averageInstallments: number;
    prefersImmediatePayment: boolean;
    immediatePaymentRate: number;
  };
  recommendedDebtRanges: Array<{
    range: string;
    count: number;
    paymentRate: number;
    averagePaymentPeriod: number;
    isRecommended: boolean;
  }>;
  nonRecommendedDebtRanges: Array<{
    range: string;
    count: number;
    paymentRate: number;
    averagePaymentPeriod: number;
    isRecommended: boolean;
  }>;
  location: {
    province: string;
    district: string;
    sector: string;
    cell: string;
    village: string;
  };
  analyzedAt: string;
}

export default function UserViewScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: analytics, isLoading, error } = useQuery<TrustabilityAnalytics>({
    queryKey: ['user-trustability', id],
    queryFn: async () => {
      const response = await apiClient.getUserTrustabilityAnalytics(id!);
      return response.payload;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft color={colors.text} size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>User Profile</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={48} />
          <Text style={styles.loadingText}>Loading user analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !analytics) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft color={colors.text} size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>User Profile</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load user data</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => window.location.reload()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const getTrustabilityColor = (percentage: number) => {
    if (percentage >= 80) return colors.success;
    if (percentage >= 60) return colors.warning;
    return colors.error;
  };

  const getTrustabilityStatus = (percentage: number) => {
    if (percentage >= 80) return 'Highly Trustable';
    if (percentage >= 60) return 'Moderately Trustable';
    return 'Low Trustability';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>User Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Header */}
        <Card style={styles.userHeaderCard}>
          <View style={styles.userHeaderContent}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {analytics.fullName.split(' ').map(n => n.charAt(0)).join('')}
              </Text>
            </View>
            <View style={styles.userHeaderInfo}>
              <Text style={styles.userName}>{analytics.fullName}</Text>
              <View style={styles.locationRow}>
                <MapPin color={colors.textSecondary} size={16} />
                <Text style={styles.locationText}>
                  {analytics.location.village}, {analytics.location.cell}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Trustability Score */}
        <Card style={styles.trustabilityCard}>
          <View style={styles.cardHeader}>
            <TrendingUp color={colors.primary} size={20} />
            <Text style={styles.cardTitle}>Trustability Score</Text>
          </View>
          <View style={styles.trustabilityContent}>
            <View style={styles.scoreContainer}>
              <Text style={[styles.scoreValue, { color: getTrustabilityColor(analytics.trustabilityPercentage) }]}>
                {analytics.trustabilityPercentage}%
              </Text>
              <Text style={styles.scoreLabel}>
                {getTrustabilityStatus(analytics.trustabilityPercentage)}
              </Text>
            </View>
            <View style={styles.scoreDetails}>
              <View style={styles.scoreDetailRow}>
                <Text style={styles.scoreDetailLabel}>Payment Success Rate</Text>
                <Text style={styles.scoreDetailValue}>{analytics.paymentSuccessRate}%</Text>
              </View>
              <View style={styles.scoreDetailRow}>
                <Text style={styles.scoreDetailLabel}>Completed Payments</Text>
                <Text style={styles.scoreDetailValue}>{analytics.completedPayments}/{analytics.possiblePayments}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Payment Patterns */}
        <Card style={styles.patternsCard}>
          <View style={styles.cardHeader}>
            <BarChart3 color={colors.primary} size={20} />
            <Text style={styles.cardTitle}>Payment Patterns</Text>
          </View>
          <View style={styles.patternsContent}>
            <View style={styles.patternRow}>
              <View style={styles.patternInfo}>
                <Text style={styles.patternLabel}>Payment Preference</Text>
                <Text style={styles.patternValue}>
                  {analytics.paymentPatterns.prefersInstallments ? 'Installments' : 'Immediate Payment'}
                </Text>
              </View>
              <View style={styles.patternPercentage}>
                <Text style={styles.patternPercentageValue}>
                  {analytics.paymentPatterns.prefersInstallments 
                    ? analytics.paymentPatterns.installmentPaymentRate 
                    : analytics.paymentPatterns.immediatePaymentRate}%
                </Text>
              </View>
            </View>
            {analytics.paymentPatterns.prefersInstallments && (
              <View style={styles.patternRow}>
                <View style={styles.patternInfo}>
                  <Text style={styles.patternLabel}>Average Installments</Text>
                  <Text style={styles.patternValue}>{analytics.paymentPatterns.averageInstallments}</Text>
                </View>
              </View>
            )}
          </View>
        </Card>

        {/* Recommended Debt Ranges */}
        <Card style={styles.rangesCard}>
          <View style={styles.cardHeader}>
            <CheckCircle color={colors.success} size={20} />
            <Text style={styles.cardTitle}>Recommended Debt Ranges</Text>
          </View>
          <View style={styles.rangesContent}>
            {analytics.recommendedDebtRanges.map((range, index) => (
              <View key={index} style={styles.rangeRow}>
                <View style={styles.rangeInfo}>
                  <Text style={styles.rangeLabel}>RWF {range.range}</Text>
                  <Text style={styles.rangeSubtext}>
                    {range.count} transactions • {range.averagePaymentPeriod} days avg
                  </Text>
                </View>
                <View style={styles.rangeRate}>
                  <Text style={[styles.rangeRateValue, { color: colors.success }]}>
                    {range.paymentRate}%
                  </Text>
                  <Text style={styles.rangeRateLabel}>Success Rate</Text>
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* Non-Recommended Debt Ranges */}
        {analytics.nonRecommendedDebtRanges.length > 0 && (
          <Card style={styles.rangesCard}>
            <View style={styles.cardHeader}>
              <XCircle color={colors.error} size={20} />
              <Text style={styles.cardTitle}>Non-Recommended Debt Ranges</Text>
            </View>
            <View style={styles.rangesContent}>
              {analytics.nonRecommendedDebtRanges.map((range, index) => (
                <View key={index} style={styles.rangeRow}>
                  <View style={styles.rangeInfo}>
                    <Text style={styles.rangeLabel}>RWF {range.range}</Text>
                    <Text style={styles.rangeSubtext}>
                      {range.count} transactions • {range.averagePaymentPeriod} days avg
                    </Text>
                  </View>
                  <View style={styles.rangeRate}>
                    <Text style={[styles.rangeRateValue, { color: colors.error }]}>
                      {range.paymentRate}%
                    </Text>
                    <Text style={styles.rangeRateLabel}>Success Rate</Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Analysis Date */}
        <Card style={styles.dateCard}>
          <View style={styles.cardHeader}>
            <Calendar color={colors.textSecondary} size={20} />
            <Text style={styles.cardTitle}>Analysis Information</Text>
          </View>
          <View style={styles.dateContent}>
            <Text style={styles.dateText}>
              Last analyzed: {new Date(analytics.analyzedAt).toLocaleDateString()}
            </Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.sm,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      marginRight: Spacing.md,
    },
    title: {
      fontSize: Typography.fontSize.xl,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
    },
    content: {
      flexGrow: 1,
      padding: Spacing.lg,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      marginTop: Spacing.md,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.lg,
    },
    errorText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.error,
      marginBottom: Spacing.md,
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
    },
    retryButtonText: {
      color: colors.white,
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
    },
    userHeaderCard: {
      marginBottom: Spacing.lg,
      borderRadius: BorderRadius.lg,
      overflow: 'hidden',
    },
    userHeaderContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.lg,
    },
    userAvatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    userAvatarText: {
      fontSize: Typography.fontSize.xl,
      fontFamily: 'DMSans-Bold',
      color: colors.primary,
    },
    userHeaderInfo: {
      flex: 1,
    },
    userName: {
      fontSize: Typography.fontSize.xl,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    locationText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      marginLeft: Spacing.xs,
    },
    trustabilityCard: {
      marginBottom: Spacing.lg,
      borderRadius: BorderRadius.lg,
      overflow: 'hidden',
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      backgroundColor: colors.primaryLight,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    cardTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginLeft: Spacing.sm,
    },
    trustabilityContent: {
      padding: Spacing.lg,
    },
    scoreContainer: {
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    scoreValue: {
      fontSize: Typography.fontSize.xxxl,
      fontFamily: 'DMSans-Bold',
      marginBottom: Spacing.xs,
    },
    scoreLabel: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.textSecondary,
    },
    scoreDetails: {
      marginTop: Spacing.md,
    },
    scoreDetailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '30',
    },
    scoreDetailLabel: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
    },
    scoreDetailValue: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
    },
    patternsCard: {
      marginBottom: Spacing.lg,
      borderRadius: BorderRadius.lg,
      overflow: 'hidden',
    },
    patternsContent: {
      padding: Spacing.lg,
    },
    patternRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '30',
    },
    patternInfo: {
      flex: 1,
    },
    patternLabel: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    patternValue: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.text,
    },
    patternPercentage: {
      alignItems: 'flex-end',
    },
    patternPercentageValue: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-Bold',
      color: colors.primary,
    },
    rangesCard: {
      marginBottom: Spacing.lg,
      borderRadius: BorderRadius.lg,
      overflow: 'hidden',
    },
    rangesContent: {
      padding: Spacing.lg,
    },
    rangeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '30',
    },
    rangeInfo: {
      flex: 1,
    },
    rangeLabel: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    rangeSubtext: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
    },
    rangeRate: {
      alignItems: 'flex-end',
    },
    rangeRateValue: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-Bold',
      marginBottom: Spacing.xs,
    },
    rangeRateLabel: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
    },
    dateCard: {
      marginBottom: Spacing.lg,
      borderRadius: BorderRadius.lg,
      overflow: 'hidden',
    },
    dateContent: {
      padding: Spacing.lg,
    },
    dateText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
    },
  });
