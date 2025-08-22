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
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { lightColors, Typography, Spacing } from '@/constants/theme';
import { apiClient, type Debt, type User } from '@/services/api';
import { MotiView } from 'moti';
import { Search, Plus, Filter } from 'lucide-react-native';
import { ScrollView as RNScrollView } from 'react-native';

type DebtWithType = Debt & {
  type: 'requested' | 'offered';
};

const statusFilters = [
  { key: 'all', label: 'All' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'OVERDUE', label: 'Overdue' },
  { key: 'PAID_PENDING_CONFIRMATION', label: 'Paid Pending' },
];

export default function DebtsScreen() {
  const { colors } = useTheme();
  const { user: currentUser } = useAuthContext();
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
  const [searchResults, setSearchResults] = useState<DebtWithType[] | null>(
    null
  );
  const [searching, setSearching] = useState(false);

  const {
    data: requestedResponse,
    isLoading: loadingRequested,
    refetch: refetchRequested,
  } = useQuery({
    queryKey: ['debts-requested'],
    queryFn: () => apiClient.getDebtsRequested({ limit: 100 }),
  });

  const {
    data: offeredResponse,
    isLoading: loadingOffered,
    refetch: refetchOffered,
  } = useQuery({
    queryKey: ['debts-offered'],
    queryFn: () => apiClient.getDebtsOffered({ limit: 100 }),
  });

  const requestedData = requestedResponse?.data || [];
  const offeredData = offeredResponse?.data || [];

  const isLoading = loadingRequested || loadingOffered;

  const handleRefresh = async () => {
    await Promise.all([refetchRequested(), refetchOffered()]);
  };

  const allDebts: DebtWithType[] = [
    ...(requestedData || []).map((debt: Debt) => ({
      ...debt,
      type: 'requested' as const,
    })),
    ...(offeredData || []).map((debt: Debt) => ({
      ...debt,
      type: 'offered' as const,
    })),
  ];

  const sortedDebts = [...allDebts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (searchQuery.trim().length > 0) {
      setSearching(true);
      timeout = setTimeout(() => {
        // Local search: filter by name or amount
        const filtered = sortedDebts.filter((debt) => {
          const searchLower = searchQuery.toLowerCase();
          const requesterName = `${debt.requester?.firstName || ''} ${
            debt.requester?.lastName || ''
          }`.toLowerCase();
          const issuerName = `${debt.issuer?.firstName || ''} ${
            debt.issuer?.lastName || ''
          }`.toLowerCase();
          const amountStr = debt.amount.toString();
          const matchesSearch =
            requesterName.includes(searchLower) ||
            issuerName.includes(searchLower) ||
            amountStr.includes(searchQuery);
          const matchesStatus =
            statusFilter === 'all' || debt.status === statusFilter;
          return matchesSearch && matchesStatus;
        });
        setSearchResults(filtered);
        setSearching(false);
      }, 400);
    } else {
      setSearchResults(null);
      setSearching(false);
    }
    return () => clearTimeout(timeout);
  }, [searchQuery, statusFilter, sortedDebts]);

  const debtsToShow =
    searchResults !== null
      ? searchResults
      : sortedDebts.filter((debt) => {
          if (statusFilter === 'all') return true;
          return debt.status === statusFilter;
        });

  const renderDebtCard = (debt: DebtWithType) => {
    const amount = parseFloat(debt.amount) || 0;
    const amountPaid = parseFloat(debt.amountPaid) || 0;
    const otherParty = debt.type === 'requested' ? debt.issuer : debt.requester;

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
        >
          <Card style={styles.debtCard}>
            <View style={styles.debtHeader}>
              <Text style={styles.debtAmount}>
                RWF {amount.toLocaleString()}
              </Text>
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

            <Text style={styles.debtType}>
              {debt.type === 'requested' ? 'Requested from' : 'Offered to'}:{' '}
              {otherParty
                ? `${otherParty.firstName} ${otherParty.lastName}`
                : 'Unknown'}
            </Text>

            {debt.paymentDate && (
              <Text style={styles.dueDate}>
                Due: {new Date(debt.paymentDate).toLocaleDateString()}
              </Text>
            )}

            {amountPaid > 0 && (
              <Text style={styles.paidAmount}>
                Paid: RWF {amountPaid.toLocaleString()} / RWF{' '}
                {amount.toLocaleString()}
              </Text>
            )}
          </Card>
        </TouchableOpacity>
      </MotiView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search color={colors.gray[400]} size={20} />
          <Input
            placeholder="Search debts by name or amount..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>
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
        {searching ? (
          <View style={styles.loadingContainer}>
            <LoadingSpinner />
          </View>
        ) : debtsToShow.length > 0 ? (
          <View style={styles.debtsList}>
            {debtsToShow.map(renderDebtCard)}
          </View>
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No debts found</Text>
            <Text style={styles.emptyDescription}>
              {searchQuery
                ? 'Try adjusting your search criteria'
                : 'Start by adding your first debt'}
            </Text>
          </Card>
        )}
      </ScrollView>
             {currentUser?.userType === 'SELLER' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/(tabs)/debts/add-debt')}
          activeOpacity={0.8}
        >
          <Plus color={colors.white} size={28} />
        </TouchableOpacity>
      )}
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
      return { backgroundColor: colors.background };
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
      return { color: colors.textSecondary };
  }
};

const getStyles = (colors: typeof lightColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    searchContainer: {
      paddingHorizontal: Spacing.lg,
      marginBottom: 0,
      marginTop: Spacing.md,
      zIndex: 2,
      backgroundColor: colors.background,
    },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingHorizontal: Spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 48,
      marginBottom: Spacing.sm,
    },
    searchInput: {
      flex: 1,
      marginLeft: Spacing.sm,
      borderWidth: 0,
      marginBottom: 0,
      fontSize: Typography.fontSize.md,
      minHeight: 44,
      paddingVertical: 0,
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Spacing.xxl,
    },
    debtsList: {
      paddingHorizontal: Spacing.lg,
    },
    debtCard: {
      marginBottom: Spacing.md,
    },
    debtHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    debtAmount: {
      fontSize: Typography.fontSize.xl,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
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
    debtType: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    dueDate: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
    },
    paidAmount: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.success,
      marginTop: Spacing.xs,
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
