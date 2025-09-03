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
import EmploymentReportModal from '@/components/ui/EmploymentReportModal';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/contexts/TranslationContext';
import { useAllEmployments, useCurrentUser } from '@/hooks';
import { Typography, Spacing } from '@/constants/theme';
import { Employment, EmploymentFilters } from '@/types/api';
import { MotiView } from 'moti';
import { 
  Search, 
  Plus, 
  Briefcase, 
  MapPin, 
  Clock, 
  DollarSign,
  Building,
  Users,
  TrendingUp,
  Filter,
  User as UserIcon,
  Calendar,
  ChevronLeft,
  AlertTriangle
} from 'lucide-react-native';

export default function EmploymentsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const styles = getStyles(colors);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'PENDING' | 'ACTIVE' | 'RESIGNED' | 'TERMINATED' | 'CANCELLED' | 'PENDING_FINISH' | 'FINISHED'>('all');
  const [viewMode, setViewMode] = useState<'as-employer' | 'as-employee'>('as-employer');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedEmploymentForReport, setSelectedEmploymentForReport] = useState<Employment | null>(null);

  const { user: currentUser } = useCurrentUser();

  // API filters
  const filters: EmploymentFilters = {
    page: 1,
    limit: 50,
    search: searchQuery.trim() || undefined,
    status: selectedFilter === 'all' ? undefined : selectedFilter,
  };

  const { 
    allEmployments, 
    employerEmployments, 
    employeeEmployments, 
    isLoading, 
    refetch 
  } = useAllEmployments(filters);

  const handleRefresh = async () => {
    await refetch();
  };

  // Helper function to check if current user is the employee
  const isEmployee = (employment: Employment) => {
    return currentUser && employment && currentUser.id === employment.employee.id;
  };

  // Helper function to check if current user is the employer
  const isEmployer = (employment: Employment) => {
    return currentUser && employment && currentUser.id === employment.employer.id;
  };

  // Helper function to get user role for reporting
  const getUserRole = (employment: Employment): 'employee' | 'employer' | null => {
    if (isEmployee(employment)) return 'employee';
    if (isEmployer(employment)) return 'employer';
    return null;
  };

  // Show report modal
  const showReportModalForEmployment = (employment: Employment) => {
    setSelectedEmploymentForReport(employment);
    setShowReportModal(true);
  };

  // Close report modal
  const closeReportModal = () => {
    setShowReportModal(false);
    setSelectedEmploymentForReport(null);
  };

  // Handle report submission
  const handleReportSubmitted = () => {
    closeReportModal();
    // Optionally refresh the data
    refetch();
  };

  // Get the appropriate employment list based on view mode
  const getEmploymentsList = () => {
    switch (viewMode) {
      case 'as-employer':
        return employerEmployments;
      case 'as-employee':
        return employeeEmployments;
      default:
        return employerEmployments;
    }
  };

  const employmentsList = getEmploymentsList();

  const statusFilters = [
    { key: 'all', label: 'All Status' },
    { key: 'PENDING', label: 'Pending' },
    { key: 'ACTIVE', label: 'Active' },
    { key: 'RESIGNED', label: 'Resigned' },
    { key: 'TERMINATED', label: 'Terminated' },
    { key: 'CANCELLED', label: 'Cancelled' },
    { key: 'PENDING_FINISH', label: 'Pending Finish' },
    { key: 'FINISHED', label: 'Finished' },
  ];

  const viewModeFilters = [
    { key: 'as-employer', label: 'As Employer' },
    { key: 'as-employee', label: 'As Employee' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return colors.success;
      case 'PENDING':
        return colors.warning;
      case 'RESIGNED':
        return colors.error;
      case 'TERMINATED':
        return colors.error;
      case 'CANCELLED':
        return colors.textSecondary;
      case 'PENDING_FINISH':
        return colors.info;
      case 'FINISHED':
        return colors.primary;
      default:
        return colors.textSecondary;
    }
  };

  const getPaymentTypeLabel = (paymentType: string) => {
    switch (paymentType) {
      case 'DAILY':
        return 'Daily';
      case 'WEEKLY':
        return 'Weekly';
      case 'MONTHLY':
        return 'Monthly';
      case 'CUSTOM_RANGE':
        return 'Custom Range';
      case 'AFTER_JOB':
        return 'After Job';
      default:
        return paymentType;
    }
  };

  const renderEmploymentCard = (employment: Employment) => (
    <MotiView
      key={employment.id}
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400 }}
    >
      <TouchableOpacity
        onPress={() => {
          router.push({
            pathname: '/(tabs)/services/employments/employment-detail',
            params: { id: employment.id },
          });
        }}
        activeOpacity={0.7}
      >
        <Card style={styles.jobCard}>
          {/* Header */}
          <View style={styles.jobHeader}>
            <View style={styles.jobTitleContainer}>
              <Text style={styles.jobTitle}>{employment.title}</Text>
              <Text style={styles.companyName}>
                {viewMode === 'as-employer' 
                  ? `${employment.employee.firstName} ${employment.employee.lastName}`
                  : `${employment.employer.firstName} ${employment.employer.lastName}`
                }
              </Text>
            </View>
            <View style={[styles.jobTypeBadge, { backgroundColor: getStatusColor(employment.status) + '15' }]}>
              <Text style={[styles.jobTypeText, { color: getStatusColor(employment.status) }]}>
                {employment.status.replace('_', ' ')}
              </Text>
            </View>
          </View>

          {/* Employment Details */}
          <View style={styles.jobDetails}>
            <View style={styles.detailItem}>
              <UserIcon color={colors.textSecondary} size={16} />
              <Text style={styles.detailText}>
                {viewMode === 'as-employer' ? 'Employee' : 'Employer'}
              </Text>
            </View>
            {employment.salary && (
              <View style={styles.detailItem}>
                <DollarSign color={colors.textSecondary} size={16} />
                <Text style={styles.detailText}>
                  RWF {employment.salary.toLocaleString()}
                </Text>
              </View>
            )}
            <View style={styles.detailItem}>
              <Clock color={colors.textSecondary} size={16} />
              <Text style={styles.detailText}>
                {getPaymentTypeLabel(employment.paymentType)}
              </Text>
            </View>
          </View>

          {/* Description */}
          {employment.description && (
            <Text style={styles.jobDescription} numberOfLines={2}>
              {employment.description}
            </Text>
          )}

          {/* Additional Info */}
          <View style={styles.requirementsPreview}>
            <View style={styles.requirementTag}>
              <Text style={styles.requirementText}>
                Created: {new Date(employment.createdAt).toLocaleDateString()}
              </Text>
            </View>
            {employment.startDate && (
              <View style={styles.requirementTag}>
                <Text style={styles.requirementText}>
                  Start: {new Date(employment.startDate).toLocaleDateString()}
                </Text>
              </View>
            )}
            {employment.resignationStatus !== 'NONE' && (
              <View style={[styles.requirementTag, { backgroundColor: colors.warning + '15' }]}>
                <Text style={[styles.requirementText, { color: colors.warning }]}>
                  Resignation: {employment.resignationStatus.replace('_', ' ')}
                </Text>
              </View>
            )}
          </View>

          {/* Report Button for AFTER_JOB payment type when ACTIVE */}
          {employment.paymentType === 'AFTER_JOB' && 
           employment.status === 'ACTIVE' && 
           getUserRole(employment) && (
            <View style={styles.reportButtonContainer}>
              <TouchableOpacity
                style={styles.reportButton}
                onPress={() => showReportModalForEmployment(employment)}
                activeOpacity={0.7}
              >
                <AlertTriangle color={colors.warning} size={16} />
                <Text style={[styles.reportButtonText, { color: colors.warning }]}>
                  Report Issue
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Card>
      </TouchableOpacity>
    </MotiView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Employment</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* View Mode Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {viewModeFilters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              onPress={() => setViewMode(filter.key as typeof viewMode)}
              style={[
                styles.tabButton,
                viewMode === filter.key && styles.tabButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  viewMode === filter.key && styles.tabTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search jobs, companies, or locations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilterModal(true)}>
          <Filter color={colors.primary} size={20} />
        </TouchableOpacity>
      </View>

      {/* Employment Listings */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.jobsList}>
            {[...Array(3)].map((_, index) => (
              <Card key={index} style={styles.jobCard}>
                <View style={styles.loadingSkeleton}>
                  <View style={[styles.skeletonLine, { width: '70%', height: 20, marginBottom: 8 }]} />
                  <View style={[styles.skeletonLine, { width: '50%', height: 16, marginBottom: 12 }]} />
                  <View style={[styles.skeletonLine, { width: '100%', height: 14, marginBottom: 8 }]} />
                  <View style={[styles.skeletonLine, { width: '80%', height: 14 }]} />
                </View>
              </Card>
            ))}
          </View>
        ) : employmentsList.length > 0 ? (
          <View style={styles.jobsList}>
            {employmentsList.map(renderEmploymentCard)}
          </View>
        ) : (
          <Card style={styles.emptyCard}>
            <Briefcase color={colors.textSecondary} size={48} />
            <Text style={styles.emptyTitle}>No Employments Found</Text>
            <Text style={styles.emptyDescription}>
              {searchQuery
                ? 'Try adjusting your search criteria'
                : 'No employment records available at the moment'}
            </Text>
          </Card>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          router.push('/(tabs)/services/employments/create-employment');
        }}
        activeOpacity={0.8}
      >
        <Plus color={colors.white} size={28} />
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Employments</Text>
            <TouchableOpacity
              onPress={() => setShowFilterModal(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Status</Text>
              <View style={styles.filterOptions}>
                {statusFilters.map((filter) => (
                  <TouchableOpacity
                    key={filter.key}
                    onPress={() => setSelectedFilter(filter.key as typeof selectedFilter)}
                    style={[
                      styles.filterOption,
                      selectedFilter === filter.key && styles.filterOptionActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        selectedFilter === filter.key && styles.filterOptionTextActive,
                      ]}
                    >
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Employment Report Modal */}
      {selectedEmploymentForReport && (
        <EmploymentReportModal
          visible={showReportModal}
          onClose={closeReportModal}
          employmentId={selectedEmploymentForReport.id}
          userRole={getUserRole(selectedEmploymentForReport)!}
          onReportSubmitted={handleReportSubmitted}
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: Spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontFamily: 'DMSans-Bold',
    color: colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
  },
  placeholder: {
    width: 40,
  },
  tabsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabsScrollContent: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  tabButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 25,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 120,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Medium',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  jobsList: {
    paddingHorizontal: Spacing.lg,
  },
  jobCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  jobTitleContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  jobTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: 'DMSans-Bold',
    color: colors.text,
    marginBottom: Spacing.xs,
  },
  companyName: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Medium',
    color: colors.textSecondary,
  },
  jobTypeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  jobTypeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: 'DMSans-SemiBold',
    textTransform: 'uppercase',
  },
  jobDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: '30%',
  },
  detailText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  jobDescription: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  requirementsPreview: {
    marginTop: Spacing.sm,
  },
  requirementsTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-SemiBold',
    color: colors.text,
    marginBottom: Spacing.sm,
  },
  requirementsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  requirementTag: {
    backgroundColor: colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  requirementText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: 'DMSans-Medium',
    color: colors.textSecondary,
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
    marginTop: Spacing.md,
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
  loadingSkeleton: {
    padding: Spacing.lg,
  },
  skeletonLine: {
    backgroundColor: colors.border,
    borderRadius: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  modalCloseText: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Medium',
    color: colors.primary,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  filterSection: {
    marginBottom: Spacing.lg,
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
  reportButtonContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    backgroundColor: colors.warning + '10',
    borderWidth: 1,
    borderColor: colors.warning + '30',
    gap: Spacing.xs,
  },
  reportButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-SemiBold',
  },
});
