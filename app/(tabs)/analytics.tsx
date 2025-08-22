import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { apiClient } from '@/services/api';
import {
  Spacing,
  Typography,
  BorderRadius,
} from '@/constants/theme';
import { MotiView } from 'moti';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Users,
  CreditCard,
  BarChart3,
  ChevronDown,
  Filter,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

type AnalyticsPeriod = 'THIS_MONTH' | 'LAST_MONTH' | 'LAST_3_MONTHS' | 'LAST_6_MONTHS' | 'THIS_YEAR' | 'CUSTOM';

interface DateRange {
  start: string;
  end: string;
}

interface MonthlyBreakdown {
  month: string;
  totalDebts: number;
  totalAmount: number;
  totalPaid: number;
  completedDebts: number;
  activeDebts: number;
  overdueDebts: number;
}

interface RecentDebt {
  id: string;
  status: string;
  amount: string;
  amountPaid: string;
  paidInstallmentsCount: number;
  initiationType: string;
  paymentDate: string;
  createdAt: string;
  updatedAt: string;
  issuer: {
    id: string;
    firstName: string;
    lastName: string;
    userType: string;
  };
  requester: {
    id: string;
    firstName: string;
    lastName: string;
    userType: string;
  };
  items: Array<{
    id: string;
    name: string;
    description: string;
    quantity: number;
    amount: string;
    totalAmount: string;
  }>;
}

interface SellerMetrics {
  totalDebts: number;
  totalItemsGiven: number;
  totalDebtAmount: number;
  totalPaidAmount: number;
  remainingAmount: number;
  completedDebts: number;
  activeDebts: number;
  overdueDebts: number;
  paymentSuccessRate: number;
  averageDebtAmount: number;
}

interface ClientMetrics {
  totalDebts: number;
  totalItemsTaken: number;
  totalDebtAmount: number;
  totalPaidAmount: number;
  remainingAmount: number;
  completedDebts: number;
  activeDebts: number;
  overdueDebts: number;
  trustabilityScore: number;
  averageDebtAmount: number;
}

interface PaymentBehavior {
  averagePaymentTime: number;
  onTimePayments: number;
  latePayments: number;
  onTimeRate: number;
  paymentTrend: string;
  totalPayments: number;
}

interface AnalyticsData {
  userId: string;
  fullName: string;
  userType: 'SELLER' | 'CLIENT';
  period: string;
  dateRange: DateRange;
  generatedAt: string;
  sellerMetrics?: SellerMetrics;
  clientMetrics?: ClientMetrics;
  paymentBehavior?: PaymentBehavior;
  monthlyBreakdown: MonthlyBreakdown[];
  recentDebts: RecentDebt[];
}

const periodOptions: Array<{ value: AnalyticsPeriod; label: string }> = [
  { value: 'THIS_MONTH', label: 'This Month' },
  { value: 'LAST_MONTH', label: 'Last Month' },
  { value: 'LAST_3_MONTHS', label: 'Last 3 Months' },
  { value: 'LAST_6_MONTHS', label: 'Last 6 Months' },
  { value: 'THIS_YEAR', label: 'This Year' },
  { value: 'CUSTOM', label: 'Custom Range' },
];

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const { user } = useAuthContext();
  const styles = getStyles(colors);
  
  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod>('THIS_MONTH');
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<Date>(new Date());
  const [customEndDate, setCustomEndDate] = useState<Date>(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const { data: analytics, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ['user-analytics', selectedPeriod, customStartDate, customEndDate],
    queryFn: async () => {
      const params: any = { period: selectedPeriod };
      if (selectedPeriod === 'CUSTOM') {
        params.startDate = customStartDate.toISOString().split('T')[0];
        params.endDate = customEndDate.toISOString().split('T')[0];
      }
      const response = await apiClient.getUserAnalytics(params);
      return response.payload;
    },
    enabled: selectedPeriod !== 'CUSTOM' || (!!customStartDate && !!customEndDate),
  });

  const handlePeriodChange = (period: AnalyticsPeriod) => {
    setSelectedPeriod(period);
    setShowPeriodPicker(false);
    if (period !== 'CUSTOM') {
      setCustomStartDate(new Date());
      setCustomEndDate(new Date());
    }
  };

  const handleCustomDateSubmit = () => {
    if (customStartDate > customEndDate) {
      Alert.alert('Error', 'Start date cannot be after end date');
      return;
    }
    setShowPeriodPicker(false);
  };

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setCustomStartDate(selectedDate);
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setCustomEndDate(selectedDate);
    }
  };

  const formatCurrency = (amount: number) => {
    return `RWF ${amount.toLocaleString()}`;
  };

  const formatPercentage = (value: number, total: number) => {
    if (total === 0) return '0%';
    return `${Math.round((value / total) * 100)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getMetrics = () => {
    if (analytics?.userType === 'SELLER' && analytics.sellerMetrics) {
      return analytics.sellerMetrics;
    }
    if (analytics?.userType === 'CLIENT' && analytics.clientMetrics) {
      return analytics.clientMetrics;
    }
    return null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return colors.success;
      case 'ACTIVE':
        return colors.primary;
      case 'OVERDUE':
        return colors.error;
      case 'PENDING':
        return colors.warning;
      default:
        return colors.textSecondary;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
        </View>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={48} />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !analytics) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load analytics</Text>
          <Text style={styles.errorSubtext}>
            {error instanceof Error ? error.message : 'Please try again later'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const metrics = getMetrics();
  const isSeller = analytics.userType === 'SELLER';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowPeriodPicker(!showPeriodPicker)}
        >
          <Filter color={colors.primary} size={20} />
          <Text style={styles.filterButtonText}>
            {periodOptions.find(p => p.value === selectedPeriod)?.label}
          </Text>
          <ChevronDown color={colors.primary} size={16} />
        </TouchableOpacity>
      </View>

      {/* Period Picker Modal */}
      {showPeriodPicker && (
        <View style={styles.periodPickerModal}>
          <Card style={styles.periodPickerCard}>
            <Text style={styles.periodPickerTitle}>Select Period</Text>
            
            {periodOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.periodOption,
                  selectedPeriod === option.value && styles.periodOptionActive
                ]}
                onPress={() => handlePeriodChange(option.value)}
              >
                <Text style={[
                  styles.periodOptionText,
                  selectedPeriod === option.value && styles.periodOptionTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}

            {selectedPeriod === 'CUSTOM' && (
              <View style={styles.customDateSection}>
                <Text style={styles.customDateLabel}>Custom Date Range</Text>
                <View style={styles.dateInputRow}>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => setShowStartDatePicker(true)}
                  >
                    <Text style={styles.dateInputText}>
                      {formatDate(customStartDate.toISOString())}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => setShowEndDatePicker(true)}
                  >
                    <Text style={styles.dateInputText}>
                      {formatDate(customEndDate.toISOString())}
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={handleCustomDateSubmit}
                >
                  <Text style={styles.applyButtonText}>Apply</Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>
        </View>
      )}

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={customStartDate}
          mode="date"
          display="default"
          onChange={onStartDateChange}
        />
      )}
      {showEndDatePicker && (
        <DateTimePicker
          value={customEndDate}
          mode="date"
          display="default"
          onChange={onEndDateChange}
        />
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <MotiView
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
        >
          {/* User Info */}
          <Card style={styles.userInfoCard}>
            <View style={styles.userInfoHeader}>
              <Users color={colors.primary} size={24} />
              <Text style={styles.userInfoTitle}>{analytics.fullName}</Text>
            </View>
            <View style={styles.userInfoDetails}>
              <Text style={styles.userTypeBadge}>
                {analytics.userType}
              </Text>
              <Text style={styles.periodText}>
                Period: {analytics.period.replace('_', ' ')}
              </Text>
              <Text style={styles.dateRangeText}>
                {formatDate(analytics.dateRange.start)} - {formatDate(analytics.dateRange.end)}
              </Text>
            </View>
          </Card>

          {/* Overview Cards */}
          {metrics && (
            <>
              <View style={styles.overviewSection}>
                <Card style={styles.overviewCard}>
                  <View style={styles.overviewHeader}>
                    <DollarSign color={colors.primary} size={24} />
                    <Text style={styles.overviewTitle}>Total Amount</Text>
                  </View>
                  <Text style={styles.overviewValue}>
                    {formatCurrency(metrics.totalDebtAmount)}
                  </Text>
                  <Text style={styles.overviewSubtext}>
                    Across {metrics.totalDebts} debts
                  </Text>
                </Card>

                <Card style={styles.overviewCard}>
                  <View style={styles.overviewHeader}>
                    <CreditCard color={colors.success} size={24} />
                    <Text style={styles.overviewTitle}>Paid Amount</Text>
                  </View>
                  <Text style={styles.overviewValue}>
                    {formatCurrency(metrics.totalPaidAmount)}
                  </Text>
                  <Text style={styles.overviewSubtext}>
                    {formatPercentage(metrics.totalPaidAmount, metrics.totalDebtAmount)}
                  </Text>
                </Card>
              </View>

              <View style={styles.overviewSection}>
                <Card style={styles.overviewCard}>
                  <View style={styles.overviewHeader}>
                    <Calendar color={colors.warning} size={24} />
                    <Text style={styles.overviewTitle}>Active Debts</Text>
                  </View>
                  <Text style={styles.overviewValue}>
                    {metrics.activeDebts}
                  </Text>
                  <Text style={styles.overviewSubtext}>
                    {formatPercentage(metrics.activeDebts, metrics.totalDebts)}
                  </Text>
                </Card>

                <Card style={styles.overviewCard}>
                  <View style={styles.overviewHeader}>
                    <AlertTriangle color={colors.error} size={24} />
                    <Text style={styles.overviewTitle}>Overdue Debts</Text>
                  </View>
                  <Text style={styles.overviewValue}>
                    {metrics.overdueDebts}
                  </Text>
                  <Text style={styles.overviewSubtext}>
                    {formatPercentage(metrics.overdueDebts, metrics.totalDebts)}
                  </Text>
                </Card>
              </View>

              {/* User Type Specific Metrics */}
              {isSeller ? (
                <Card style={styles.metricsCard}>
                  <Text style={styles.sectionTitle}>Seller Metrics</Text>
                  <View style={styles.metricRow}>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>Items Given</Text>
                      <Text style={styles.metricValue}>
                        {metrics.totalItemsGiven}
                      </Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>Payment Success Rate</Text>
                      <Text style={styles.metricValue}>
                        {metrics.paymentSuccessRate}%
                      </Text>
                    </View>
                  </View>
                </Card>
              ) : (
                <Card style={styles.metricsCard}>
                  <Text style={styles.sectionTitle}>Client Metrics</Text>
                  <View style={styles.metricRow}>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>Items Taken</Text>
                      <Text style={styles.metricValue}>
                        {metrics.totalItemsTaken}
                      </Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>Trustability Score</Text>
                      <Text style={styles.metricValue}>
                        {metrics.trustabilityScore}%
                      </Text>
                    </View>
                  </View>
                </Card>
              )}

              {/* Payment Behavior (Client only) */}
              {!isSeller && analytics.paymentBehavior && (
                <Card style={styles.paymentBehaviorCard}>
                  <Text style={styles.sectionTitle}>Payment Behavior</Text>
                  <View style={styles.paymentBehaviorGrid}>
                    <View style={styles.paymentBehaviorItem}>
                      <Clock color={colors.primary} size={20} />
                      <Text style={styles.paymentBehaviorLabel}>Avg Payment Time</Text>
                      <Text style={styles.paymentBehaviorValue}>
                        {analytics.paymentBehavior.averagePaymentTime} days
                      </Text>
                    </View>
                    <View style={styles.paymentBehaviorItem}>
                      <CheckCircle color={colors.success} size={20} />
                      <Text style={styles.paymentBehaviorLabel}>On-Time Rate</Text>
                      <Text style={styles.paymentBehaviorValue}>
                        {analytics.paymentBehavior.onTimeRate}%
                      </Text>
                    </View>
                    <View style={styles.paymentBehaviorItem}>
                      <TrendingUp color={colors.warning} size={20} />
                      <Text style={styles.paymentBehaviorLabel}>Payment Trend</Text>
                      <Text style={styles.paymentBehaviorValue}>
                        {analytics.paymentBehavior.paymentTrend}
                      </Text>
                    </View>
                  </View>
                </Card>
              )}

              {/* Monthly Breakdown */}
              {analytics.monthlyBreakdown && analytics.monthlyBreakdown.length > 0 && (
                <Card style={styles.breakdownCard}>
                  <Text style={styles.sectionTitle}>Monthly Breakdown</Text>
                  
                  {analytics.monthlyBreakdown.map((month, index) => (
                    <View key={index} style={styles.breakdownRow}>
                      <View style={styles.breakdownInfo}>
                        <Text style={styles.breakdownMonth}>{month.month}</Text>
                        <Text style={styles.breakdownCount}>
                          {month.totalDebts} debts
                        </Text>
                      </View>
                      <View style={styles.breakdownAmounts}>
                        <Text style={styles.breakdownTotal}>
                          Total: {formatCurrency(month.totalAmount)}
                        </Text>
                        <Text style={styles.breakdownPaid}>
                          Paid: {formatCurrency(month.totalPaid)}
                        </Text>
                      </View>
                      <View style={styles.breakdownStatus}>
                        <View style={styles.statusIndicator}>
                          <Text style={styles.statusText}>
                            {month.activeDebts} Active
                          </Text>
                        </View>
                        <View style={styles.statusIndicator}>
                          <Text style={styles.statusText}>
                            {month.overdueDebts} Overdue
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </Card>
              )}

              {/* Recent Debts */}
              {analytics.recentDebts && analytics.recentDebts.length > 0 && (
                <Card style={styles.recentDebtsCard}>
                  <Text style={styles.sectionTitle}>Recent Debts</Text>
                  
                  {analytics.recentDebts.map((debt, index) => (
                    <View key={index} style={styles.debtRow}>
                      <View style={styles.debtInfo}>
                        <Text style={styles.debtAmount}>
                          {formatCurrency(parseFloat(debt.amount))}
                        </Text>
                        <Text style={styles.debtStatus}>
                          Status: {debt.status}
                        </Text>
                        <Text style={styles.debtDate}>
                          Due: {formatDate(debt.paymentDate)}
                        </Text>
                      </View>
                      <View style={styles.debtDetails}>
                        <Text style={styles.debtType}>
                          {debt.initiationType}
                        </Text>
                        <Text style={styles.debtPaid}>
                          Paid: {formatCurrency(parseFloat(debt.amountPaid))}
                        </Text>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(debt.status) + '20' }
                        ]}>
                          <Text style={[
                            styles.statusBadgeText,
                            { color: getStatusColor(debt.status) }
                          ]}>
                            {debt.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </Card>
              )}
            </>
          )}

          {/* Generated At */}
          <Card style={styles.generatedCard}>
            <Text style={styles.sectionTitle}>Analysis Information</Text>
            <Text style={styles.generatedText}>
              Generated: {formatDate(analytics.generatedAt)}
            </Text>
          </Card>
        </MotiView>
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
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: Typography.fontSize.xl,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterButtonText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
      color: colors.primary,
      marginHorizontal: Spacing.xs,
    },
    periodPickerModal: {
      position: 'absolute',
      top: 80,
      right: Spacing.lg,
      zIndex: 1000,
    },
    periodPickerCard: {
      minWidth: 200,
      padding: Spacing.md,
    },
    periodPickerTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginBottom: Spacing.md,
      textAlign: 'center',
    },
    periodOption: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.sm,
      marginBottom: Spacing.xs,
    },
    periodOptionActive: {
      backgroundColor: colors.primary + '20',
    },
    periodOptionText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.text,
    },
    periodOptionTextActive: {
      color: colors.primary,
      fontFamily: 'DMSans-Medium',
    },
    customDateSection: {
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    customDateLabel: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    dateInputRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    dateInput: {
      flex: 1,
      padding: Spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BorderRadius.sm,
      backgroundColor: colors.background,
    },
    dateInputText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.text,
      textAlign: 'center',
    },
    applyButton: {
      backgroundColor: colors.primary,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.sm,
      alignItems: 'center',
    },
    applyButtonText: {
      color: colors.white,
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
    },
    content: {
      flex: 1,
      padding: Spacing.lg,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.lg,
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
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-Bold',
      color: colors.error,
      marginBottom: Spacing.sm,
      textAlign: 'center',
    },
    errorSubtext: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    overviewSection: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginBottom: Spacing.md,
    },
    overviewCard: {
      flex: 1,
      padding: Spacing.md,
      alignItems: 'center',
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    overviewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    overviewTitle: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
      color: colors.textSecondary,
      marginLeft: Spacing.xs,
    },
    overviewValue: {
      fontSize: Typography.fontSize.xl,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    overviewSubtext: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    metricsCard: {
      marginBottom: Spacing.lg,
      padding: Spacing.lg,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginBottom: Spacing.md,
    },
    metricRow: {
      flexDirection: 'row',
      gap: Spacing.lg,
    },
    metricItem: {
      flex: 1,
    },
    metricLabel: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    metricValue: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
    },
    paymentBehaviorCard: {
      marginBottom: Spacing.lg,
      padding: Spacing.lg,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    paymentBehaviorGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: Spacing.md,
    },
    paymentBehaviorItem: {
      alignItems: 'center',
    },
    paymentBehaviorLabel: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
      color: colors.textSecondary,
      marginTop: Spacing.xs,
    },
    paymentBehaviorValue: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-Bold',
      color: colors.primary,
      marginTop: Spacing.xs,
    },
    breakdownCard: {
      marginBottom: Spacing.lg,
      padding: Spacing.lg,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    breakdownRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '30',
    },
    breakdownInfo: {
      flex: 1,
    },
    breakdownMonth: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    breakdownCount: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
    },
    breakdownAmounts: {
      alignItems: 'flex-end',
    },
    breakdownTotal: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    breakdownPaid: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Bold',
      color: colors.success,
    },
    breakdownStatus: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    statusIndicator: {
      backgroundColor: colors.background,
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statusText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
      color: colors.textSecondary,
    },
    recentDebtsCard: {
      marginBottom: Spacing.lg,
      padding: Spacing.lg,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    debtRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '30',
    },
    debtInfo: {
      flex: 1,
    },
    debtAmount: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    debtStatus: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    debtDate: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
    },
    debtDetails: {
      alignItems: 'flex-end',
    },
    debtType: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    debtPaid: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Bold',
      color: colors.success,
      marginBottom: Spacing.xs,
    },
    statusBadge: {
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      borderRadius: BorderRadius.sm,
    },
    statusBadgeText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
    },
    userInfoCard: {
      marginBottom: Spacing.lg,
      padding: Spacing.lg,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    userInfoHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    userInfoTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginLeft: Spacing.sm,
    },
    userInfoDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: Spacing.xs,
    },
    userTypeBadge: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
      color: colors.primary,
      backgroundColor: colors.primary + '10',
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      borderRadius: BorderRadius.sm,
    },
    periodText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
    },
    dateRangeText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
    },
    generatedCard: {
      marginTop: Spacing.lg,
      padding: Spacing.lg,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    generatedText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });
