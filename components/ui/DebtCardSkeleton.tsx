import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonLoader } from './SkeletonLoader';
import { Card } from './Card';
import { Spacing } from '@/constants/theme';

export const DebtCardSkeleton: React.FC = () => {
  return (
    <Card style={styles.card}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <SkeletonLoader width={80} height={16} borderRadius={12} />
          <SkeletonLoader width={60} height={16} borderRadius={12} />
        </View>
        <SkeletonLoader width={100} height={24} borderRadius={8} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <SkeletonLoader width="100%" height={6} borderRadius={3} />
        <SkeletonLoader width={60} height={14} borderRadius={4} style={styles.progressText} />
      </View>

      {/* Party Information */}
      <View style={styles.partyInfo}>
        <SkeletonLoader width={32} height={32} borderRadius={16} />
        <SkeletonLoader width={120} height={16} borderRadius={4} />
      </View>

      {/* Details Row */}
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <SkeletonLoader width={14} height={14} borderRadius={7} />
          <SkeletonLoader width={80} height={14} borderRadius={4} />
        </View>
        <View style={styles.detailItem}>
          <SkeletonLoader width={100} height={14} borderRadius={4} />
        </View>
      </View>

      {/* Payment Summary */}
      <View style={styles.paymentSummary}>
        <View style={styles.paymentRow}>
          <SkeletonLoader width={40} height={14} borderRadius={4} />
          <SkeletonLoader width={80} height={14} borderRadius={4} />
        </View>
        <View style={styles.paymentRow}>
          <SkeletonLoader width={70} height={14} borderRadius={4} />
          <SkeletonLoader width={80} height={14} borderRadius={4} />
        </View>
      </View>

      {/* Items Preview */}
      <View style={styles.itemsPreview}>
        <SkeletonLoader width={80} height={16} borderRadius={4} />
        <SkeletonLoader width="100%" height={14} borderRadius={4} />
        <SkeletonLoader width="90%" height={14} borderRadius={4} />
        <SkeletonLoader width={60} height={14} borderRadius={4} />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'column',
    gap: Spacing.xs,
  },
  progressContainer: {
    marginBottom: Spacing.md,
  },
  progressText: {
    alignSelf: 'center',
    marginTop: Spacing.xs,
  },
  partyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  detailsRow: {
    marginBottom: Spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  paymentSummary: {
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  itemsPreview: {
    borderRadius: 12,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
});
