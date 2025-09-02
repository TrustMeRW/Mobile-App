import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import {
  User as UserIcon,
  MapPin,
  TrendingUp,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react-native';

interface Location {
  province: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
}

interface DebtRange {
  range: string;
  count: number;
  paymentRate: number;
  averagePaymentPeriod: number;
  isRecommended: boolean;
}

interface PaymentPatterns {
  prefersInstallments: boolean;
  installmentPaymentRate: number;
  averageInstallments: number;
  prefersImmediatePayment: boolean;
  immediatePaymentRate: number;
}

interface UserTrustabilityData {
  userId: string;
  fullName: string;
  trustabilityPercentage: number;
  possiblePayments: number;
  completedPayments: number;
  paymentSuccessRate: number;
  paymentPatterns: PaymentPatterns;
  recommendedDebtRanges: DebtRange[];
  nonRecommendedDebtRanges: DebtRange[];
  location: Location;
  analyzedAt: string;
}

interface UserTrustabilityDisplayProps {
  data: UserTrustabilityData;
}

export default function UserTrustabilityDisplay({
  data,
}: UserTrustabilityDisplayProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const getTrustabilityColor = (percentage: number) => {
    if (percentage >= 80) return colors.success;
    if (percentage >= 60) return colors.warning;
    return colors.error;
  };

  const getTrustabilityStatus = (percentage: number) => {
    if (percentage >= 80) return 'Excellent';
    if (percentage >= 60) return 'Good';
    if (percentage >= 40) return 'Fair';
    return 'Poor';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* User Header */}
      <Card style={styles.userHeaderCard}>
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <UserIcon color={colors.white} size={28} />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{data.fullName}</Text>
              <Text style={styles.userSubtitle}>User Profile</Text>
            </View>
          </View>
          <View style={styles.trustabilityScore}>
            <Text style={styles.scoreLabel}>Trustability Score</Text>
            <View style={[styles.scoreCircle, { borderColor: getTrustabilityColor(data.trustabilityPercentage) }]}>
              <Text style={[
                styles.scoreValue,
                { color: getTrustabilityColor(data.trustabilityPercentage) }
              ]}>
                {data.trustabilityPercentage}%
              </Text>
            </View>
            <Text style={[
              styles.scoreStatus,
              { color: getTrustabilityColor(data.trustabilityPercentage) }
            ]}>
              {getTrustabilityStatus(data.trustabilityPercentage)}
            </Text>
          </View>
        </View>
      </Card>

      {/* Location Information */}
      <Card style={styles.locationCard}>
        <View style={styles.sectionHeader}>
          <MapPin color={colors.primary} size={20} />
          <Text style={styles.sectionTitle}>Location</Text>
        </View>
        <View style={styles.locationDetails}>
          <Text style={styles.locationText}>
            {data.location.province}, {data.location.district}
          </Text>
          <Text style={styles.locationText}>
            {data.location.sector}, {data.location.cell}
          </Text>
          <Text style={styles.locationText}>
            {data.location.village}
          </Text>
        </View>
      </Card>

      {/* Payment Statistics */}
      <Card style={styles.statsCard}>
        <View style={styles.sectionHeader}>
          <TrendingUp color={colors.primary} size={20} />
          <Text style={styles.sectionTitle}>Payment Statistics</Text>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <TrendingUp color={colors.primary} size={18} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{data.possiblePayments}</Text>
              <Text style={styles.statLabel}>Total Payments</Text>
              <Text style={styles.statSubtext}>All time</Text>
            </View>
          </View>
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <CheckCircle color={colors.success} size={18} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{data.completedPayments}</Text>
              <Text style={styles.statLabel}>Completed</Text>
              <Text style={styles.statSubtext}>Successful</Text>
            </View>
          </View>
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Shield color={colors.info} size={18} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{data.paymentSuccessRate}%</Text>
              <Text style={styles.statLabel}>Success Rate</Text>
              <Text style={styles.statSubtext}>Reliability</Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Payment Patterns */}
      <Card style={styles.patternsCard}>
        <View style={styles.sectionHeader}>
          <Shield color={colors.primary} size={20} />
          <Text style={styles.sectionTitle}>Payment Patterns</Text>
        </View>
        <View style={styles.patternsContent}>
          <View style={styles.patternRow}>
            <Text style={styles.patternLabel}>Prefers Installments:</Text>
            <View style={styles.patternValue}>
              {data.paymentPatterns.prefersInstallments ? (
                <CheckCircle color={colors.success} size={16} />
              ) : (
                <AlertTriangle color={colors.warning} size={16} />
              )}
              <Text style={styles.patternText}>
                {data.paymentPatterns.prefersInstallments ? 'Yes' : 'No'}
              </Text>
            </View>
          </View>
          <View style={styles.patternRow}>
            <Text style={styles.patternLabel}>Installment Rate:</Text>
            <Text style={styles.patternText}>
              {data.paymentPatterns.installmentPaymentRate}%
            </Text>
          </View>
          <View style={styles.patternRow}>
            <Text style={styles.patternLabel}>Avg Installments:</Text>
            <Text style={styles.patternText}>
              {data.paymentPatterns.averageInstallments}
            </Text>
          </View>
        </View>
      </Card>

      {/* Recommended Debt Ranges */}
      {data.recommendedDebtRanges.length > 0 && (
        <Card style={styles.rangesCard}>
          <View style={styles.sectionHeader}>
            <CheckCircle color={colors.success} size={20} />
            <Text style={styles.sectionTitle}>Recommended Debt Ranges</Text>
          </View>
          {data.recommendedDebtRanges.map((range, index) => (
            <View key={index} style={styles.rangeItem}>
              <View style={styles.rangeHeader}>
                <Text style={styles.rangeAmount}>RWF {range.range}</Text>
                <View style={[styles.recommendedBadge, { backgroundColor: colors.success + '20' }]}>
                  <Text style={[styles.recommendedText, { color: colors.success }]}>
                    Recommended
                  </Text>
                </View>
              </View>
              <View style={styles.rangeStats}>
                <Text style={styles.rangeStat}>
                  {range.count} debts • {range.paymentRate}% success
                </Text>
                <Text style={styles.rangeStat}>
                  Avg payment: {range.averagePaymentPeriod} days
                </Text>
              </View>
            </View>
          ))}
        </Card>
      )}

      {/* Non-Recommended Debt Ranges */}
      {data.nonRecommendedDebtRanges.length > 0 && (
        <Card style={styles.rangesCard}>
          <View style={styles.sectionHeader}>
            <AlertTriangle color={colors.warning} size={20} />
            <Text style={styles.sectionTitle}>Non-Recommended Debt Ranges</Text>
          </View>
          {data.nonRecommendedDebtRanges.map((range, index) => (
            <View key={index} style={styles.rangeItem}>
              <View style={styles.rangeHeader}>
                <Text style={styles.rangeAmount}>RWF {range.range}</Text>
                <View style={[styles.recommendedBadge, { backgroundColor: colors.warning + '20' }]}>
                  <Text style={[styles.recommendedText, { color: colors.warning }]}>
                    Caution
                  </Text>
                </View>
              </View>
              <View style={styles.rangeStats}>
                <Text style={styles.rangeStat}>
                  {range.count} debts • {range.paymentRate}% success
                </Text>
                <Text style={styles.rangeStat}>
                  Avg payment: {range.averagePaymentPeriod} days
                </Text>
              </View>
            </View>
          ))}
        </Card>
      )}

      {/* Analysis Information */}
      <Card style={styles.analysisCard}>
        <View style={styles.sectionHeader}>
          <Shield color={colors.primary} size={20} />
          <Text style={styles.sectionTitle}>Analysis Information</Text>
        </View>
        <Text style={styles.analysisText}>
          Analyzed on: {formatDate(data.analyzedAt)}
        </Text>
      </Card>
    </ScrollView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  userHeaderCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userHeader: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  userInfo: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  userAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  userDetails: {
    alignItems: 'center',
  },
  userName: {
    fontSize: Typography.fontSize.xl,
    fontFamily: 'DMSans-Bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  userSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
  },
  trustabilityScore: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Medium',
    color: colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    backgroundColor: colors.background,
  },
  scoreValue: {
    fontSize: Typography.fontSize.lg,
    fontFamily: 'DMSans-Bold',
  },
  scoreStatus: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Medium',
  },
  locationCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Bold',
    color: colors.text,
    marginLeft: Spacing.sm,
  },
  locationDetails: {
    marginLeft: Spacing.xl,
  },
  locationText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  statsCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statsContainer: {
    flexDirection: 'column',
    gap: Spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: colors.background,
    borderRadius: BorderRadius.sm,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Medium',
    color: colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: Typography.fontSize.lg,
    fontFamily: 'DMSans-Bold',
    color: colors.primary,
    marginBottom: Spacing.xs,
  },
  statSubtext: {
    fontSize: Typography.fontSize.xs,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
  },
  patternsCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  patternsContent: {
    marginLeft: Spacing.xl,
  },
  patternRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  patternLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Medium',
    color: colors.textSecondary,
  },
  patternValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patternText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Medium',
    color: colors.text,
    marginLeft: Spacing.xs,
  },
  rangesCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rangeItem: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '30',
  },
  rangeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  rangeAmount: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Bold',
    color: colors.text,
  },
  recommendedBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  recommendedText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Medium',
  },
  rangeStats: {
    marginLeft: Spacing.md,
  },
  rangeStat: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  analysisCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  analysisText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    marginLeft: Spacing.xl,
  },
});
