import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { apiClient, type Debt, type User } from '@/services/api';
import { MotiView } from 'moti';
import { Search, Plus, Filter } from 'lucide-react-native';

type DebtWithType = Debt & {
  type: 'requested' | 'offered';
};

export default function DebtsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'requested' | 'offered'>('all');

  // Fetch requested and offered debts with proper typing
  const { data: requestedResponse, isLoading: loadingRequested, refetch: refetchRequested } = useQuery({
    queryKey: ['debts-requested'],
    queryFn: () => apiClient.getDebtsRequested({ limit: 100 }),
  });

  const { data: offeredResponse, isLoading: loadingOffered, refetch: refetchOffered } = useQuery({
    queryKey: ['debts-offered'],
    queryFn: () => apiClient.getDebtsOffered({ limit: 100 }),
  });

  // Extract data from the response
  const requestedData = requestedResponse?.data || [];
  const offeredData = offeredResponse?.data || [];

  const isLoading = loadingRequested || loadingOffered;

  const handleRefresh = async () => {
    await Promise.all([refetchRequested(), refetchOffered()]);
  };

  // Combine and map the debts with their types
  const allDebts: DebtWithType[] = [
    ...((requestedData || []).map((debt: Debt) => ({ ...debt, type: 'requested' as const }))),
    ...((offeredData || []).map((debt: Debt) => ({ ...debt, type: 'offered' as const }))),
  ];

  // Sort by creation date (newest first)
  const sortedDebts = [...allDebts].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const filteredDebts = sortedDebts.filter((debt: DebtWithType) => {
    if (!searchQuery) return selectedFilter === 'all' || debt.type === selectedFilter;
    
    const searchLower = searchQuery.toLowerCase();
    const requesterName = `${debt.requester?.firstName || ''} ${debt.requester?.lastName || ''}`.toLowerCase();
    const issuerName = `${debt.issuer?.firstName || ''} ${debt.issuer?.lastName || ''}`.toLowerCase();
    const amountStr = debt.amount.toString();
    
    const matchesSearch = 
      requesterName.includes(searchLower) || 
      issuerName.includes(searchLower) ||
      amountStr.includes(searchQuery);
    
    const matchesFilter = selectedFilter === 'all' || debt.type === selectedFilter;

    return matchesSearch && matchesFilter;
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
          onPress={() => router.push({
            pathname: '/(tabs)/debts/debt-detail',
            params: { id: debt.id },
          })}
        >
          <Card style={styles.debtCard}>
            <View style={styles.debtHeader}>
              <Text style={styles.debtAmount}>RWF {amount.toLocaleString()}</Text>
              <View style={[styles.statusBadge, getStatusBadgeStyle(debt.status)]}>
                <Text style={[styles.statusText, getStatusTextStyle(debt.status)]}>
                  {debt.status.replace(/_/g, ' ')}
                </Text>
              </View>
            </View>
            
            <Text style={styles.debtType}>
              {debt.type === 'requested' ? 'Requested from' : 'Offered to'}: {' '}
              {otherParty ? `${otherParty.firstName} ${otherParty.lastName}` : 'Unknown'}
            </Text>
            
            {debt.paymentDate && (
              <Text style={styles.dueDate}>
                Due: {new Date(debt.paymentDate).toLocaleDateString()}
              </Text>
            )}
            
            {amountPaid > 0 && (
              <Text style={styles.paidAmount}>
                Paid: RWF {amountPaid.toLocaleString()} / RWF {amount.toLocaleString()}
              </Text>
            )}
          </Card>
        </TouchableOpacity>
      </MotiView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Debts</Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/debts/add-debt')}
          style={styles.addButton}
        >
          <Plus color={Colors.white} size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search color={Colors.gray[400]} size={20} />
          <Input
            placeholder="Search debts..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>
      </View>

      <View style={styles.filterContainer}>
        {(['all', 'requested', 'offered'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            onPress={() => setSelectedFilter(filter)}
            style={[
              styles.filterButton,
              selectedFilter === filter && styles.filterButtonActive,
            ]}
          >
            <Text style={[
              styles.filterText,
              selectedFilter === filter && styles.filterTextActive,
            ]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <LoadingSpinner />
          </View>
        ) : sortedDebts.length > 0 ? (
          <View style={styles.debtsList}>
            {sortedDebts.map(renderDebtCard)}
          </View>
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No debts found</Text>
            <Text style={styles.emptyDescription}>
              {searchQuery ? 'Try adjusting your search criteria' : 'Start by adding your first debt'}
            </Text>
          </Card>
        )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize.xxxl,
    fontFamily: 'DMSans-Bold',
    color: Colors.dark,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    borderWidth: 0,
    marginBottom: 0,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray[300],
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Medium',
    color: Colors.gray[600],
  },
  filterTextActive: {
    color: Colors.white,
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
    color: Colors.dark,
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
    color: Colors.dark,
    marginBottom: Spacing.xs,
  },
  dueDate: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Regular',
    color: Colors.gray[600],
  },
  paidAmount: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Regular',
    color: Colors.success,
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
    color: Colors.dark,
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Regular',
    color: Colors.gray[600],
    textAlign: 'center',
  },
});