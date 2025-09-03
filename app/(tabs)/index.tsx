import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser, useDashboard, useWebSocketNotifications } from '@/hooks';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Typography, Spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/contexts/TranslationContext';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowDown,
  ArrowUp,
  UserPlus,
  Bell,
  Hand,
  Clock,
  Eye,
  MessageCircle,
  X,
  Check,
  Phone,
  Calendar,
  TrendingUp,
  TrendingDown,
} from 'lucide-react-native';
import { NotificationBell } from '@/components/NotificationBell';
import { router } from 'expo-router';

interface Debt {
  status: 'ACTIVE' | 'COMPLETED' | 'OVERDUE' | 'PAID_PENDING_CONFIRMATION' | 'PENDING' | 'REJECTED';
}

interface PendingPayment {
  id: string;
  amount: string;
  fromUser: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
  paymentMethod: string;
  createdAt: string;
  status: 'PENDING';
}

interface PendingAction {
  id: string;
  type: 'PAYMENT_REQUEST' | 'DEBT_REQUEST';
  amount: string;
  fromUser: {
    firstName: string;
    lastName: string;
  };
  dueDate?: string;
  status: 'PENDING';
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = getStyles(colors);
  const { user, isLoading: userLoading, refetch: refetchUser } = useCurrentUser();
  const { unreadCount } = useWebSocketNotifications();

  const {
    data: dashboardData,
    isLoading: loadingDashboard,
    refetch: refetchDashboard,
  } = useDashboard();

  const isLoading = loadingDashboard || userLoading;

  const handleRefresh = async () => {
    await Promise.all([
      refetchDashboard(),
      refetchUser(),
    ]);
  };

  const hasData = dashboardData && (
    (dashboardData.debtsYouOwe?.totalAmount || 0) > 0 ||
    (dashboardData.debtsTheyOweYou?.totalAmount || 0) > 0 ||
    (dashboardData.employments || 0) > 0 ||
    (dashboardData.employees || 0) > 0 ||
    (dashboardData.jobPaymentsToPay?.totalAmount || 0) > 0 ||
    (dashboardData.jobPaymentsToGet?.totalAmount || 0) > 0 ||
    (dashboardData.pendingActions?.pendingDebtActions?.length || 0) > 0 ||
    (dashboardData.pendingActions?.pendingEmploymentActions?.length || 0) > 0
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatAmount = (amount: string) => {
    return parseFloat(amount).toLocaleString();
  };

  const getDaysLeft = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays} Day${diffDays !== 1 ? 's' : ''} Left` : 'Overdue';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner />
      </View>
    );
  }

  if (!hasData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.firstName?.charAt(0) || 'U'}
              </Text>
            </View>
            <View>
              <Text style={styles.greeting}>Hello {user?.firstName || 'User'} 👋</Text>
              <Text style={styles.subGreeting}>Welcome to TrustME</Text>
            </View>
          </View>
          <NotificationBell />
        </View>
        
        <View style={styles.welcomeContainer}>
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 600 }}
          >
            <View style={styles.welcomeCard}>
              <View style={styles.welcomeIcon}>
                <Hand color={colors.primary} size={48} />
              </View>
              <Text style={styles.welcomeTitle}>Welcome!</Text>
              <Text style={styles.welcomeMessage}>
                Start by creating your first debt or employment opportunity to see your dashboard come to life.
              </Text>
            </View>
          </MotiView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#080C1C" />
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Linear Gradient */}
        <LinearGradient
          colors={['#080C1C', '#253882']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <SafeAreaView edges={['top']} style={styles.header}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.firstName?.charAt(0) || 'U'}
                </Text>
              </View>
              <View>
                <Text style={styles.greeting}>Hello {user?.firstName || 'User'} 👋</Text>
              </View>
            </View>
            <View style={styles.notificationContainer}>
              <NotificationBell />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View> 
              )}
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.quickActionsTitle}>Quick actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/(tabs)/services/debts/add-debt')}
            >
              <View style={styles.quickActionIcon}>
                <ArrowUp color={colors.white} size={24} />
              </View>
              <Text style={styles.quickActionText}>Offer Debt</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/(tabs)/services/employments/create-employment')}
            >
              <View style={styles.quickActionIcon}>
                <UserPlus color={colors.white} size={24} />
              </View>
              <Text style={styles.quickActionText}>Offer employment</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Overview Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.horizontalStatsScroll}
            contentContainerStyle={styles.horizontalStatsContent}
          >
            <MotiView
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', duration: 600, delay: 100 }}
            >
              <Card style={[styles.horizontalStatCard, styles.debtYouOweCard]}>
                <Text style={styles.statLabel}>Debts you owe</Text>
                <View style={styles.statIconContainer}>
                  <ArrowUp color={colors.error} size={20} />
                </View>
                <Text style={[styles.statAmount, { color: colors.error }]}>
                  {formatAmount(dashboardData?.debtsYouOwe?.remainingAmount?.toString() || '0')} RWF
                </Text>
                <Text style={styles.statSubtext}>
                  Total: {formatAmount(dashboardData?.debtsYouOwe?.totalAmount?.toString() || '0')} RWF
                </Text>
                <Text style={styles.statSubtext}>
                  Paid: {formatAmount(dashboardData?.debtsYouOwe?.totalAmountPaid?.toString() || '0')} RWF
                </Text>
              </Card>
            </MotiView>

            <MotiView
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', duration: 600, delay: 200 }}
            >
              <Card style={[styles.horizontalStatCard, styles.debtTheyOweCard]}>
                <Text style={styles.statLabel}>Debts they owe</Text>
                <View style={styles.statIconContainer}>
                  <ArrowDown color={colors.primary} size={20} />
                </View>
                <Text style={[styles.statAmount, { color: colors.primary }]}>
                  {formatAmount(dashboardData?.debtsTheyOweYou?.remainingAmount?.toString() || '0')} RWF
                </Text>
                <Text style={styles.statSubtext}>
                  Total: {formatAmount(dashboardData?.debtsTheyOweYou?.totalAmount?.toString() || '0')} RWF
                </Text>
                <Text style={styles.statSubtext}>
                  Paid: {formatAmount(dashboardData?.debtsTheyOweYou?.totalAmountPaid?.toString() || '0')} RWF
                </Text>
              </Card>
            </MotiView>

            <MotiView
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', duration: 600, delay: 300 }}
            >
              <Card style={[styles.horizontalStatCard, styles.employmentCard]}>
                <Text style={styles.statLabel}>Active Employments</Text>
                <View style={styles.statIconContainer}>
                  <UserPlus color={colors.primary} size={20} />
                </View>
                <Text style={[styles.statAmount, { color: colors.primary }]}>
                  {dashboardData?.employments || 0}
                </Text>
                <Text style={styles.statSubtext}>
                  Total employments
                </Text>
              </Card>
            </MotiView>

            <MotiView
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', duration: 600, delay: 400 }}
            >
              <Card style={[styles.horizontalStatCard, styles.employeesCard]}>
                <Text style={styles.statLabel}>Total Employees</Text>
                <View style={styles.statIconContainer}>
                  <TrendingUp color={colors.success} size={20} />
                </View>
                <Text style={[styles.statAmount, { color: colors.success }]}>
                  {dashboardData?.employees || 0}
                </Text>
                <Text style={styles.statSubtext}>
                  People working with you
                </Text>
              </Card>
            </MotiView>

            <MotiView
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', duration: 600, delay: 500 }}
            >
              <Card style={[styles.horizontalStatCard, styles.paymentToPayCard]}>
                <Text style={styles.statLabel}>Payments to Pay</Text>
                <View style={styles.statIconContainer}>
                  <ArrowUp color={colors.warning} size={20} />
                </View>
                <Text style={[styles.statAmount, { color: colors.warning }]}>
                  {formatAmount(dashboardData?.jobPaymentsToPay?.pendingAmount?.toString() || '0')} RWF
                </Text>
                <Text style={styles.statSubtext}>
                  Total: {formatAmount(dashboardData?.jobPaymentsToPay?.totalAmount?.toString() || '0')} RWF
                </Text>
                <Text style={styles.statSubtext}>
                  Confirmed: {formatAmount(dashboardData?.jobPaymentsToPay?.confirmedAmount?.toString() || '0')} RWF
                </Text>
              </Card>
            </MotiView>

            <MotiView
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', duration: 600, delay: 600 }}
            >
              <Card style={[styles.horizontalStatCard, styles.paymentToGetCard]}>
                <Text style={styles.statLabel}>Payments to Get</Text>
                <View style={styles.statIconContainer}>
                  <ArrowDown color={colors.success} size={20} />
                </View>
                <Text style={[styles.statAmount, { color: colors.success }]}>
                  {formatAmount(dashboardData?.jobPaymentsToGet?.pendingAmount?.toString() || '0')} RWF
                </Text>
                <Text style={styles.statSubtext}>
                  Total: {formatAmount(dashboardData?.jobPaymentsToGet?.totalAmount?.toString() || '0')} RWF
                </Text>
                <Text style={styles.statSubtext}>
                  Confirmed: {formatAmount(dashboardData?.jobPaymentsToGet?.confirmedAmount?.toString() || '0')} RWF
                </Text>
              </Card>
            </MotiView>
          </ScrollView>
        </View>

        {/* Pending Actions */}
        {dashboardData?.pendingActions?.pendingDebtActions && dashboardData.pendingActions.pendingDebtActions.length > 0 && (
          <View style={styles.pendingSection}>
            <Text style={styles.sectionTitle}>Pending actions</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {dashboardData.pendingActions.pendingDebtActions.map((action, index) => (
                <MotiView
                  key={action.id}
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 600, delay: index * 100 }}
                >
                  <Card style={styles.pendingCard}>
                    <View style={styles.pendingHeader}>
                      <View style={styles.pendingIcon}>
                        <Hand color={colors.primary} size={20} />
                      </View>
                      <Text style={styles.pendingUserName}>
                        {action.requesterName}
                      </Text>
                    </View>
                    
                    <Text style={styles.pendingMethod}>
                      Debt Request
                    </Text>
                    <Text style={styles.pendingTime}>
                      {formatTime(action.createdAt)}
                    </Text>
                    
                    <Text style={styles.pendingLabel}>Amount</Text>
                    <Text style={styles.pendingAmount}>
                      {formatAmount(action.amount.toString())} RWF
                    </Text>
                    
                    <View style={styles.pendingActions}>
                      <TouchableOpacity 
                        style={styles.viewButton}
                        onPress={() => router.push(`/(tabs)/services/debts/debt-detail?id=${action.id}`)}
                      >
                        <Eye color={colors.white} size={16} />
                        <Text style={styles.buttonText}>View</Text>
                      </TouchableOpacity>
                    </View>
                  </Card>
                </MotiView>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Pending Employment Actions */}
        {dashboardData?.pendingActions?.pendingEmploymentActions && dashboardData.pendingActions.pendingEmploymentActions.length > 0 && (
          <View style={styles.pendingSection}>
            <Text style={styles.sectionTitle}>Pending employment</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {dashboardData.pendingActions.pendingEmploymentActions.map((action, index) => (
                <MotiView
                  key={action.id}
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 600, delay: index * 100 }}
                >
                  <Card style={styles.pendingCard}>
                    <View style={styles.pendingHeader}>
                      <View style={styles.pendingIcon}>
                        <UserPlus color={colors.primary} size={20} />
                      </View>
                      <Text style={styles.pendingUserName}>
                        {action.employeeName}
                      </Text>
                    </View>
                    
                    <Text style={styles.pendingMethod}>
                      {action.title}
                    </Text>
                    <Text style={styles.pendingTime}>
                      {formatTime(action.createdAt)}
                    </Text>
                    
                    <Text style={styles.pendingLabel}>Employment Request</Text>
                    <Text style={styles.pendingAmount}>
                      {action.employerName}
                    </Text>
                    
                    <View style={styles.pendingActions}>
                      <TouchableOpacity 
                        style={styles.viewButton}
                        onPress={() => router.push(`/(tabs)/services/employments/employment-detail?id=${action.id}`)}
                      >
                        <Eye color={colors.white} size={16} />
                        <Text style={styles.buttonText}>View</Text>
                      </TouchableOpacity>
                    </View>
                  </Card>
                </MotiView>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

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
    headerGradient: {
      paddingBottom: Spacing.lg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.md,
    },
    notificationContainer: {
      position: 'relative',
    },
    notificationBadge: {
      position: 'absolute',
      top: -5,
      right: -5,
      backgroundColor: colors.error,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.white,
      zIndex: 10,
    },
    notificationBadgeText: {
      color: colors.white,
      fontSize: Typography.fontSize.xs,
      fontFamily: 'DMSans-Bold',
      textAlign: 'center',
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    avatarText: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
    },
    greeting: {
      fontSize: Typography.fontSize.xl,
      fontFamily: 'DMSans-Bold',
      color: colors.white,
    },
    subGreeting: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.white,
      opacity: 0.8,
    },
    welcomeContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
    },
    welcomeCard: {
      backgroundColor: colors.card,
      borderRadius: Spacing.lg,
      padding: Spacing.xl,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    welcomeIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.lg,
    },
    welcomeTitle: {
      fontSize: Typography.fontSize.xxl,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginBottom: Spacing.md,
    },
    welcomeMessage: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    quickActionsSection: {
      backgroundColor: '#253882',
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.lg,
    },
    quickActionsTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-SemiBold',
      color: colors.white,
      marginBottom: Spacing.md,
    },
    sectionTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-SemiBold',
      color: colors.text,
      marginBottom: Spacing.md,
    },
    quickActions: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: Spacing.xl,
    },
    quickActionButton: {
      alignItems: 'center',
      flex: 1,
      marginHorizontal: Spacing.xs,
    },
    quickActionIcon: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.white + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.sm,
    },
    quickActionText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
      color: colors.white,
      textAlign: 'center',
    },
    statsSection: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.lg,
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    horizontalStatsScroll: {
      marginTop: Spacing.sm,
    },
    horizontalStatsContent: {
      paddingRight: Spacing.lg,
    },
    horizontalStatCard: {
      width: 280,
      marginRight: Spacing.md,
      padding: Spacing.lg,
      borderWidth: 2,
    },
    statCard: {
      flex: 1,
      marginHorizontal: Spacing.xs,
      padding: Spacing.lg,
      borderWidth: 2,
    },
    debtYouOweCard: {
      borderColor: colors.error + '30',
      backgroundColor: colors.error + '05',
    },
    debtTheyOweCard: {
      borderColor: colors.primary + '30',
      backgroundColor: colors.primary + '05',
    },
    employmentCard: {
      borderColor: colors.primary + '30',
      backgroundColor: colors.primary + '05',
    },
    employeesCard: {
      borderColor: colors.success + '30',
      backgroundColor: colors.success + '05',
    },
    paymentToPayCard: {
      borderColor: colors.warning + '30',
      backgroundColor: colors.warning + '05',
    },
    paymentToGetCard: {
      borderColor: colors.success + '30',
      backgroundColor: colors.success + '05',
    },
    statLabel: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
      color: colors.textSecondary,
      marginBottom: Spacing.sm,
    },
    statIconContainer: {
      alignSelf: 'flex-start',
      marginBottom: Spacing.sm,
    },
    statAmount: {
      fontSize: Typography.fontSize.xl,
      fontFamily: 'DMSans-Bold',
    },
    statSubtext: {
      fontSize: Typography.fontSize.xs,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      marginTop: Spacing.xs,
    },
    pendingSection: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.lg,
    },
    horizontalScroll: {
      marginTop: Spacing.sm,
    },
    pendingCard: {
      width: 280,
      marginRight: Spacing.md,
      padding: Spacing.lg,
      backgroundColor: colors.card,
      borderRadius: Spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pendingHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    pendingIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.sm,
    },
    pendingUserName: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-SemiBold',
      color: colors.text,
      flex: 1,
    },
    pendingDaysLeft: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
      color: colors.warning,
    },
    pendingMethod: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    pendingTime: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      marginBottom: Spacing.sm,
    },
    pendingLabel: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    pendingAmount: {
      fontSize: Typography.fontSize.xl,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginBottom: Spacing.lg,
    },
    pendingActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: Spacing.xs,
    },
    viewButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: Spacing.sm,
    },
    declineButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.textSecondary,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: Spacing.sm,
    },
    confirmButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.success,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: Spacing.sm,
    },
    viewDetailsButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.textSecondary,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: Spacing.sm,
      marginRight: Spacing.sm,
    },
    contactButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: Spacing.sm,
    },
    buttonText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-SemiBold',
      color: colors.white,
      marginLeft: Spacing.xs,
    },
  });