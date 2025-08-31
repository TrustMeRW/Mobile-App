import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonLoader } from './SkeletonLoader';
import { Card } from './Card';
import { Spacing } from '@/constants/theme';

export const DebtDetailSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <SkeletonLoader width={24} height={24} borderRadius={12} />
        <SkeletonLoader width={120} height={24} borderRadius={8} />
      </View>

      {/* Amount Card */}
      <Card style={styles.amountCard}>
        <View style={styles.amountHeader}>
          <SkeletonLoader width={56} height={56} borderRadius={28} />
          <View style={styles.amountContent}>
            <SkeletonLoader width={100} height={16} borderRadius={8} />
            <SkeletonLoader width={150} height={32} borderRadius={8} />
          </View>
        </View>
        
        <View style={styles.statusRow}>
          <SkeletonLoader width={80} height={24} borderRadius={16} />
          <SkeletonLoader width={80} height={24} borderRadius={16} />
        </View>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <SkeletonLoader width={20} height={20} borderRadius={10} />
            <SkeletonLoader width={120} height={16} borderRadius={8} />
          </View>
          <SkeletonLoader width="100%" height={8} borderRadius={4} />
          <View style={styles.progressDetails}>
            <View style={styles.progressRow}>
              <SkeletonLoader width={100} height={14} borderRadius={7} />
              <SkeletonLoader width={60} height={14} borderRadius={7} />
            </View>
            <View style={styles.progressRow}>
              <SkeletonLoader width={100} height={14} borderRadius={7} />
              <SkeletonLoader width={80} height={14} borderRadius={7} />
            </View>
          </View>
        </View>

        {/* Summary Grid */}
        <View style={styles.summaryGrid}>
          {[...Array(3)].map((_, index) => (
            <View key={index} style={styles.summaryItem}>
              <SkeletonLoader width={40} height={40} borderRadius={20} />
              <SkeletonLoader width={80} height={14} borderRadius={7} />
              <SkeletonLoader width={100} height={20} borderRadius={10} />
              <SkeletonLoader width={60} height={14} borderRadius={7} />
            </View>
          ))}
        </View>
      </Card>

      {/* Details Card */}
      <Card style={styles.detailsCard}>
        <View style={styles.sectionHeader}>
          <SkeletonLoader width={24} height={24} borderRadius={12} />
          <SkeletonLoader width={100} height={20} borderRadius={10} />
        </View>

        {[...Array(4)].map((_, index) => (
          <View key={index} style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
              <SkeletonLoader width={20} height={20} borderRadius={10} />
            </View>
            <View style={styles.detailContent}>
              <SkeletonLoader width={80} height={14} borderRadius={7} />
              <SkeletonLoader width={120} height={16} borderRadius={8} />
            </View>
          </View>
        ))}
      </Card>

      {/* Items Card */}
      <Card style={styles.itemsCard}>
        <View style={styles.sectionHeader}>
          <SkeletonLoader width={24} height={24} borderRadius={12} />
          <SkeletonLoader width={80} height={20} borderRadius={10} />
        </View>

        {[...Array(3)].map((_, index) => (
          <View key={index} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <View style={styles.itemHeader}>
                <SkeletonLoader width={120} height={16} borderRadius={8} />
                <SkeletonLoader width={60} height={20} borderRadius={10} />
              </View>
              <SkeletonLoader width={200} height={14} borderRadius={7} />
            </View>
            <View style={styles.itemDetails}>
              <SkeletonLoader width={80} height={16} borderRadius={8} />
              <SkeletonLoader width={100} height={14} borderRadius={7} />
            </View>
          </View>
        ))}
      </Card>

      {/* Payments Card */}
      <Card style={styles.paymentsCard}>
        <View style={styles.sectionHeader}>
          <SkeletonLoader width={24} height={24} borderRadius={12} />
          <SkeletonLoader width={120} height={20} borderRadius={10} />
        </View>

        {[...Array(2)].map((_, index) => (
          <View key={index} style={styles.paymentItem}>
            <View style={styles.paymentInfo}>
              <View style={styles.paymentHeader}>
                <View style={styles.paymentAmountContainer}>
                  <SkeletonLoader width={20} height={20} borderRadius={10} />
                  <SkeletonLoader width={100} height={20} borderRadius={10} />
                </View>
                <SkeletonLoader width={80} height={24} borderRadius={12} />
              </View>
              <SkeletonLoader width={150} height={14} borderRadius={7} />
            </View>
          </View>
        ))}
      </Card>

      {/* Actions Card */}
      <Card style={styles.actionCard}>
        <View style={styles.sectionHeader}>
          <SkeletonLoader width={24} height={24} borderRadius={12} />
          <SkeletonLoader width={80} height={20} borderRadius={10} />
        </View>

        <View style={styles.actionSection}>
          <View style={styles.actionSectionHeader}>
            <SkeletonLoader width={20} height={20} borderRadius={10} />
            <SkeletonLoader width={120} height={16} borderRadius={8} />
          </View>
          <SkeletonLoader width="100%" height={48} borderRadius={8} />
          <SkeletonLoader width="100%" height={48} borderRadius={8} />
        </View>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  amountCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  amountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    width: '100%',
  },
  amountContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    width: '100%',
  },
  progressSection: {
    width: '100%',
    marginTop: Spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  progressDetails: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  summaryGrid: {
    flexDirection: 'column',
    marginTop: Spacing.md,
    gap: Spacing.md,
    width: '100%',
  },
  summaryItem: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    width: '100%',
    gap: Spacing.sm,
  },
  detailsCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.md,
  },
  detailContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  itemsCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  itemInfo: {
    flex: 1,
    marginRight: Spacing.md,
    gap: Spacing.xs,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  itemDetails: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  paymentsCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  paymentItem: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    paddingVertical: Spacing.md,
  },
  paymentInfo: {
    marginBottom: Spacing.sm,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  paymentAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  actionSection: {
    marginBottom: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  actionSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
});
