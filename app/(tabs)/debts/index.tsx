import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { DebtCardSkeleton } from '@/components/ui/DebtCardSkeleton';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/contexts/TranslationContext';
import { useCurrentUser, useDebts } from '@/hooks';
import { Typography, Spacing } from '@/constants/theme';
import { type Debt, type User } from '@/services/api';
import { MotiView } from 'moti';
import { Search, Plus, Filter, UserIcon, Calendar } from 'lucide-react-native';
import { ScrollView as RNScrollView } from 'react-native';

type DebtWithType = Debt & {
  type: 'requested' | 'offered';
};

export default function DebtsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { user: currentUser } = useCurrentUser();
  const styles = getStyles(colors);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    | 'all'
    | 'ACTIVE'
    | 'PENDING'
    | 'COMPLETED'
    | 'OVERDUE'
    | 'PAID_PENDING_CONFIRMATION'
  >('all');

  const statusFilters = [
    { key: 'all', label: t('debts.filters.all') },
    { key: 'ACTIVE', label: t('debts.filters.active') },
    { key: 'PENDING', label: t('debts.filters.pending') },
    { key: 'COMPLETED', label: t('debts.filters.completed') },
    { key: 'OVERDUE', label: t('debts.filters.overdue') },
    { key: 'PAID_PENDING_CONFIRMATION', label: t('debts.filters.paidPending') },
  ];
  // Remove searchResults/searching/debouncedSearchQuery state

  const {
    data: myDebtsResponse,
    isLoading: loadingMyDebts,
    refetch: refetchMyDebts,
  } = useDebts({ 
    limit: 100,
    includeRequested: true,
    includeOffered: true
  });

  const myDebtsData = myDebtsResponse?.data || [];
  const isLoading = loadingMyDebts;

  const handleRefresh = async () => {
    await refetchMyDebts();
  };

  const allDebts: DebtWithType[] = (myDebtsData || []).map((debt: Debt) => {
    // Determine if this is a requested or offered debt based on the current user
    // You might need to adjust this logic based on your API response structure
    const isRequested = debt.requester?.id === currentUser?.id;
    return {
      ...debt,
      type: isRequested ? 'requested' as const : 'offered' as const,
    };
  });

  const sortedDebts = [...allDebts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Synchronous, derived search and filter
  const debtsToShow = sortedDebts.filter((debt) => {
    const matchesStatus =
      statusFilter === 'all' || debt.status === statusFilter;
    if (!searchQuery.trim()) return matchesStatus;
    const searchLower = searchQuery.toLowerCase();
    const requesterName = `${debt.requester?.firstName || ''} ${
      debt.requester?.lastName || ''
    }`.toLowerCase();
    const issuerName = `${debt.issuer?.firstName || ''} ${
      debt.issuer?.lastName || ''
    }`.toLowerCase();
    const amountStr = debt.amount?.toString() || '';
    const matchesSearch =
      requesterName.includes(searchLower) ||
      issuerName.includes(searchLower) ||
      amountStr.includes(searchQuery);
    return matchesSearch && matchesStatus;
  });

  // ...existing code...

  const renderDebtCard = (debt: DebtWithType) => {
    const amount = parseFloat(debt.amount) || 0;
    const amountPaid = parseFloat(debt.amountPaid) || 0;
    const otherParty = debt.type === 'requested' ? debt.issuer : debt.requester;
    const dueDate = debt.paymentDate ? new Date(debt.paymentDate) : null;
    const isOverdue = dueDate && dueDate < new Date() && debt.status === 'ACTIVE';
    const progressPercentage = amount > 0 ? (amountPaid / amount) * 100 : 0;

    return (
      <MotiView
        key={debt.id}
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
      >
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: '/(tabs)/debts/debt-detail',
              params: { id: debt.id },
            })
          }
          activeOpacity={0.7}
        >
          <Card style={styles.debtCard}>
            {/* Header Section */}
            <View style={styles.debtHeader}>
              <View style={styles.debtTypeContainer}>
                <View style={[
                  styles.debtTypeBadge,
                  { backgroundColor: debt.type === 'requested' ? colors.primary + '15' : colors.success + '15' }
                ]}>
                  <Text style={[
                    styles.debtTypeText,
                    { color: debt.type === 'requested' ? colors.primary : colors.success }
                  ]}>
                    {debt.type === 'requested' ? t('debts.debtTypes.requested') : t('debts.debtTypes.offered')}
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
                    {debt.status.replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.debtAmount}>
                RWF {amount.toLocaleString()}
              </Text>
            </View>

            {/* Progress Bar */}
            {amountPaid > 0 && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(progressPercentage, 100)}%` }
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {progressPercentage.toFixed(1)}% {t('debts.progress.paid')}
                </Text>
              </View>
            )}

            {/* Party Information */}
            <View style={styles.partyInfo}>
              <View style={styles.partyIconContainer}>
                <UserIcon 
                  color={debt.type === 'requested' ? colors.primary : colors.success} 
                  size={16} 
                />
              </View>
              <Text style={styles.partyText}>
                {debt.type === 'requested' ? t('debts.partyInfo.from') : t('debts.partyInfo.to')}:{' '}
                <Text style={styles.partyName}>
                  {otherParty
                    ? `${otherParty.firstName} ${otherParty.lastName}`
                    : t('debts.partyInfo.unknown')}
                </Text>
              </Text>
            </View>

            {/* Additional Details */}
            <View style={styles.detailsRow}>
              {dueDate && (
                <View style={styles.detailItem}>
                  <Calendar color={colors.gray[500]} size={14} />
                  <Text style={[
                    styles.detailText,
                    isOverdue && { color: colors.error }
                  ]}>
                    {t('debts.dueDate')}: {dueDate.toLocaleDateString()}
                    {isOverdue && ` (${t('debts.overdue')})`}
                  </Text>
                </View>
              )}
              
              <View style={styles.detailItem}>
                <Text style={styles.detailText}>
                  {t('debts.createdAt')}: {new Date(debt.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>

            {/* Payment Summary */}
            {amountPaid > 0 && (
              <View style={styles.paymentSummary}>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>{t('debts.payment.paid')}:</Text>
                  <Text style={styles.paymentAmount}>
                    RWF {amountPaid.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>{t('debts.payment.remaining')}:</Text>
                  <Text style={styles.paymentAmount}>
                    RWF {(amount - amountPaid).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}

            {/* Items Preview */}
            {debt.items && debt.items.length > 0 && (
              <View style={styles.itemsPreview}>
                <Text style={styles.itemsPreviewTitle}>
                  {debt.items.length} item{debt.items.length !== 1 ? 's' : ''}
                </Text>
                {debt.items.slice(0, 2).map((item, index) => (
                  <Text key={item.id} style={styles.itemPreviewText}>
                    • {item.name} ({item.quantity}x)
                  </Text>
                ))}
                {debt.items.length > 2 && (
                  <Text style={styles.itemsMoreText}>
                    +{debt.items.length - 2} more items
                  </Text>
                )}
              </View>
            )}
          </Card>
        </TouchableOpacity>
      </MotiView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <Input
          placeholder={t('debts.searchPlaceholder')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInputContainer}
        />
      </View>
      <View style={styles.filterScrollWrapper}>
        <RNScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {statusFilters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              onPress={() => setStatusFilter(filter.key as typeof statusFilter)}
              style={[
                styles.filterButton,
                statusFilter === filter.key && styles.filterButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  statusFilter === filter.key && styles.filterTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </RNScrollView>
      </View>
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.debtsList}>
            {[...Array(6)].map((_, index) => (
              <DebtCardSkeleton key={index} />
            ))}
          </View>
        ) : debtsToShow && debtsToShow.length > 0  ? (
          <View style={styles.debtsList}>
            {debtsToShow.map(renderDebtCard)}
          </View>
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>{t('debts.noDebts')}</Text>
            <Text style={styles.emptyDescription}>
              {searchQuery
                ? t('debts.searchNoResults')
                : t('debts.noDebtsMessage')}
            </Text>
          </Card>
        )}
      </ScrollView>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(tabs)/debts/add-debt')}
        activeOpacity={0.8}
      >
        <Plus color={colors.white} size={28} />
      </TouchableOpacity>
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
      return { backgroundColor: colors.background };
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
      return { color: colors.textSecondary };
  }
};

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    searchContainer: {
      paddingHorizontal: Spacing.lg,
      marginTop: Spacing.md,
      zIndex: 2,
      backgroundColor: colors.background,
    },
    searchInputContainer: {
      borderRadius: 12,
      paddingHorizontal: Spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
    },
    searchInput: {
      borderWidth: 0,
      fontSize: Typography.fontSize.md,
    },
    filterScrollWrapper: {
      paddingHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
      backgroundColor: colors.background,
    },
    filterContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    filterButton: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      marginRight: Spacing.sm,
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.gray[300],
    },
    filterButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
      color: colors.textSecondary,
    },
    filterTextActive: {
      color: colors.white,
    },
    content: {
      flex: 1,
    },
    debtsList: {
      paddingHorizontal: Spacing.lg,
    },
    debtCard: {
      marginBottom: Spacing.md,
      padding: Spacing.lg,
      borderRadius: 16,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    debtHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Spacing.md,
    },
    debtTypeContainer: {
      flexDirection: 'column',
      gap: Spacing.xs,
    },
    debtTypeBadge: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: 12,
      alignSelf: 'flex-start',
    },
    debtTypeText: {
      fontSize: Typography.fontSize.xs,
      fontFamily: 'DMSans-SemiBold',
      textTransform: 'uppercase',
    },
    debtAmount: {
      fontSize: Typography.fontSize.xl,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      textAlign: 'right',
    },
    statusBadge: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: 12,
      alignSelf: 'flex-start',
    },
    statusText: {
      fontSize: Typography.fontSize.xs,
      fontFamily: 'DMSans-SemiBold',
      textTransform: 'uppercase',
    },
    progressContainer: {
      marginBottom: Spacing.md,
    },
    progressBar: {
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: Spacing.xs,
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.success,
      borderRadius: 3,
    },
    progressText: {
      fontSize: Typography.fontSize.xs,
      fontFamily: 'DMSans-Medium',
      color: colors.success,
      textAlign: 'center',
    },
    partyInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    partyIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.sm,
    },
    partyText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      flex: 1,
    },
    partyName: {
      fontFamily: 'DMSans-SemiBold',
      color: colors.text,
    },
    detailsRow: {
      marginBottom: Spacing.md,
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.xs,
    },
    detailText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      marginLeft: Spacing.xs,
    },
    paymentSummary: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: Spacing.md,
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    paymentRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.xs,
    },
    paymentLabel: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
      color: colors.textSecondary,
    },
    paymentAmount: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-SemiBold',
      color: colors.text,
    },
    itemsPreview: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    itemsPreviewTitle: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-SemiBold',
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    itemPreviewText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    itemsMoreText: {
      fontSize: Typography.fontSize.xs,
      fontFamily: 'DMSans-Medium',
      color: colors.primary,
      fontStyle: 'italic',
    },
    emptyCard: {
      marginHorizontal: Spacing.lg,
      alignItems: 'center',
      paddingVertical: Spacing.xxl,
    },
    emptyTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-SemiBold',
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    emptyDescription: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    fab: {
      position: 'absolute',
      right: 24,
      bottom: 32,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 6,
      zIndex: 100,
    },
  });
