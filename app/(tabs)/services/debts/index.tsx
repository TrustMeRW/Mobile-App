import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { DebtCardSkeleton } from '@/components/ui/DebtCardSkeleton';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/contexts/TranslationContext';
import { useCurrentUser, useDebtsRequested, useDebtsOffered } from '@/hooks';
import { Typography, Spacing } from '@/constants/theme';
import { type Debt } from '@/services/api';
import { MotiView } from 'moti';
import { 
  Search, 
  Plus, 
  Filter, 
  UserIcon, 
  Calendar, 
  ChevronLeft,
  X
} from 'lucide-react-native';

type TabType = 'requested' | 'offered';

interface DebtFilters {
  status?: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | 'REJECTED' | 'OVERDUE';
  dateFrom?: string;
  dateTo?: string;
}

export default function DebtsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { user: currentUser } = useCurrentUser();
  const router = useRouter();
  const styles = getStyles(colors);
  
  const [activeTab, setActiveTab] = useState<TabType>('requested');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<DebtFilters>({});

  // API parameters
  const apiParams = {
    search: searchQuery.trim() || undefined,
    status: filters.status,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    limit: 50,
    page: 1,
  };

  // API calls
  const {
    data: requestedDebtsResponse,
    isLoading: loadingRequested,
    refetch: refetchRequested,
  } = useDebtsRequested(apiParams);

  const {
    data: offeredDebtsResponse,
    isLoading: loadingOffered,
    refetch: refetchOffered,
  } = useDebtsOffered(apiParams);

  const currentDebts = activeTab === 'requested' ? requestedDebtsResponse?.data || [] : offeredDebtsResponse?.data || [];
  const isLoading = activeTab === 'requested' ? loadingRequested : loadingOffered;

  const handleRefresh = async () => {
    if (activeTab === 'requested') {
      await refetchRequested();
    } else {
      await refetchOffered();
    }
  };

  const tabs = [
    { key: 'requested' as TabType, label: 'Requested' },
    { key: 'offered' as TabType, label: 'Offered' },
  ];

  const statusFilters = [
    { key: undefined, label: 'All Status' },
    { key: 'PENDING' as const, label: 'Pending' },
    { key: 'ACTIVE' as const, label: 'Active' },
    { key: 'INACTIVE' as const, label: 'Inactive' },
    { key: 'COMPLETED' as const, label: 'Completed' },
    { key: 'REJECTED' as const, label: 'Rejected' },
    { key: 'OVERDUE' as const, label: 'Overdue' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return colors.success;
      case 'PENDING':
        return colors.warning;
      case 'OVERDUE':
        return colors.error;
      case 'COMPLETED':
        return colors.info;
      case 'REJECTED':
        return colors.error;
      case 'INACTIVE':
        return colors.textSecondary;
      default:
        return colors.textSecondary;
    }
  };

  const renderDebtCard = (debt: Debt) => {
    const amount = parseFloat(debt.amount) || 0;
    const amountPaid = parseFloat(debt.amountPaid) || 0;
    const otherParty = activeTab === 'requested' ? debt.issuer : debt.requester;
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
              pathname: '/(tabs)/services/debts/debt-detail',
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
                  { backgroundColor: activeTab === 'requested' ? colors.primary + '15' : colors.success + '15' }
                ]}>
                  <Text style={[
                    styles.debtTypeText,
                    { color: activeTab === 'requested' ? colors.primary : colors.success }
                  ]}>
                    {activeTab === 'requested' ? 'Requested' : 'Offered'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(debt.status) + '20' }
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(debt.status) }
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
                  {progressPercentage.toFixed(1)}% Paid
                </Text>
              </View>
            )}

            {/* Party Information */}
            <View style={styles.partyInfo}>
              <View style={styles.partyIconContainer}>
                <UserIcon 
                  color={activeTab === 'requested' ? colors.primary : colors.success} 
                  size={16} 
                />
              </View>
              <Text style={styles.partyText}>
                {activeTab === 'requested' ? 'From' : 'To'}:{' '}
                <Text style={styles.partyName}>
                  {otherParty
                    ? `${otherParty.firstName} ${otherParty.lastName}`
                    : 'Unknown'}
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
                    Due: {dueDate.toLocaleDateString()}
                    {isOverdue && ' (Overdue)'}
                  </Text>
                </View>
              )}
              
              <View style={styles.detailItem}>
                <Text style={styles.detailText}>
                  Created: {new Date(debt.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>

            {/* Payment Summary */}
            {amountPaid > 0 && (
              <View style={styles.paymentSummary}>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Paid:</Text>
                  <Text style={styles.paymentAmount}>
                    RWF {amountPaid.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Remaining:</Text>
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

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Filter Debts</Text>
          <TouchableOpacity
            onPress={() => setShowFilterModal(false)}
            style={styles.modalCloseButton}
          >
            <X color={colors.text} size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Status</Text>
            <View style={styles.filterOptions}>
              {statusFilters.map((filter) => (
                <TouchableOpacity
                  key={filter.key || 'all'}
                  onPress={() => setFilters(prev => ({ ...prev, status: filter.key }))}
                  style={[
                    styles.filterOption,
                    filters.status === filter.key && styles.filterOptionActive
                  ]}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filters.status === filter.key && styles.filterOptionTextActive
                  ]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.clearButton]}
              onPress={() => {
                setFilters({});
                setShowFilterModal(false);
              }}
            >
              <Text style={[styles.modalButtonText, { color: colors.error }]}>
                Clear Filters
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.applyButton]}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={[styles.modalButtonText, { color: colors.white }]}>
                Apply Filters
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Debts</Text>
        <TouchableOpacity
          onPress={() => setShowFilterModal(true)}
          style={styles.filterButton}
        >
          <Filter color={colors.text} size={24} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.tabButton,
                activeTab === tab.key && styles.tabButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search debts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInputContainer}
        />
      </View>

      {/* Content */}
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
        ) : currentDebts && currentDebts.length > 0 ? (
          <View style={styles.debtsList}>
            {currentDebts.map(renderDebtCard)}
          </View>
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No Debts Found</Text>
            <Text style={styles.emptyDescription}>
              {searchQuery || filters.status
                ? 'No debts match your current filters'
                : `You don't have any ${activeTab} debts yet`}
            </Text>
          </Card>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(tabs)/services/debts/add-debt')}
        activeOpacity={0.8}
      >
        <Plus color={colors.white} size={28} />
      </TouchableOpacity>

      {/* Filter Modal */}
      {renderFilterModal()}
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
      paddingTop: Spacing.xs,
      paddingBottom: Spacing.md,
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
      flex: 1,
    },
    filterButton: {
      padding: Spacing.sm,
    },
    tabsContainer: {
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tabsScrollContent: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
    },
    tabButton: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      marginRight: Spacing.md,
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tabButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    tabText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
      color: colors.textSecondary,
    },
    tabTextActive: {
      color: colors.white,
    },
    searchContainer: {
      paddingHorizontal: Spacing.lg,
      marginTop: Spacing.md,
      backgroundColor: colors.background,
    },
    searchInputContainer: {
      borderRadius: 12,
      paddingHorizontal: Spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: Spacing.md,
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
    // Modal styles
    modalContainer: {
      flex: 1,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
    },
    modalCloseButton: {
      padding: Spacing.sm,
    },
    modalContent: {
      flex: 1,
      paddingHorizontal: Spacing.lg,
    },
    filterSection: {
      marginTop: Spacing.lg,
    },
    filterSectionTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-SemiBold',
      color: colors.text,
      marginBottom: Spacing.md,
    },
    filterOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    filterOption: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterOptionActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterOptionText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
      color: colors.textSecondary,
    },
    filterOptionTextActive: {
      color: colors.white,
    },
    modalActions: {
      flexDirection: 'row',
      gap: Spacing.md,
      paddingVertical: Spacing.xl,
      marginTop: Spacing.lg,
    },
    modalButton: {
      flex: 1,
      paddingVertical: Spacing.md,
      borderRadius: 12,
      alignItems: 'center',
    },
    clearButton: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.error,
    },
    applyButton: {
      backgroundColor: colors.primary,
    },
    modalButtonText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-SemiBold',
    },
  });