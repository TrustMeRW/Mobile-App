import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/contexts/TranslationContext';
import { useCurrentUser } from '@/hooks';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { PaymentInstructionsModal } from '@/components/ui/PaymentInstructionsModal';
import { Typography, Spacing } from '@/constants/theme';
import { apiClient } from '@/services/api';
import { SubscriptionPlan } from '@/types/api';
import { MotiView } from 'moti';
import { ChevronLeft, Check, Crown, Phone, Info, Clock, Gift, AlertCircle, Calendar } from 'lucide-react-native';

interface UserProfile {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    nationalId: string;
    email: string;
    phoneNumber: string;
    province: string;
    district: string;
    sector: string;
    cell: string;
    village: string;
    role: string;
    code: string;
    pin: string;
    isTrustable: boolean;
    status: string;
    isActive: boolean;
    pinFailureCount: number;
    lastPinFailureAt: string | null;
    accountBlockedAt: string | null;
    updatedAt: string;
    createdAt: string;
  };
  currentSubscription: {
    id: string;
    userId: string;
    planId: string | null;
    status: string;
    startDate: string;
    endDate: string;
    amountPaid: string;
    paymentMethod: string;
    transactionId: string;
    paymentMetadata: {
      type: string;
      duration: string;
      features: {
        maxDevices: number;
        maxDebtsAllowed: number;
        maxTrustabilityChecks: number;
      };
      planDetails: any;
    };
    usageTracking: {
      debtsCreated: number;
      lastResetDate: string;
      monthlyPeriod: string;
      lastDebtCreation: string;
      remainingDebtsAllowed: number;
      trustabilityChecksUsed: number;
      remainingTrustabilityChecks: number;
    };
    lastBillingDate: string | null;
    nextBillingDate: string | null;
    autoRenew: boolean;
    cancellationReason: string | null;
    cancelledAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  subscriptionStatus: string;
  subscriptionFeatures: {
    maxTrustabilityChecks: number;
    maxDebtsAllowed: number;
    maxDevices: number;
    planName: string;
    planDescription: string;
    planAmount: number;
    planDuration: number;
    isFreeTrial: boolean;
    remainingChecks: number;
    trialEndDate: string;
    daysLeftInTrial: number;
  };
  subscriptionDetails: {
    type: string;
    startDate: string;
    endDate: string;
    daysRemaining: number;
    isActive: boolean;
    formattedEndDate: string;
    status: string;
  };
  subscriptionSummary: {
    hasActiveSubscription: boolean;
    subscriptionType: string;
    daysRemaining: number;
    endDate: string;
    status: string;
    isFreeTrial: boolean;
    isPaidSubscription: boolean;
    message: string;
  };
}

export default function SubscriptionsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { user } = useCurrentUser();
  const styles = getStyles(colors);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const queryClient = useQueryClient();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Fetch user profile with subscription data
  const { data: userProfile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => apiClient.getProfile(),
    enabled: !!user,
  });

  // Debug logging for the query
  console.log('Query loading:', profileLoading);
  console.log('Query error:', profileError);
  console.log('User from hook:', user);

  const { data: subscriptionPlans, isLoading: plansLoading, error } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => apiClient.getActiveSubscriptionPlans(),
  });

  const subscribeMutation = useMutation({
    mutationFn: (planId: string) => apiClient.subscribeToPlan(planId),
    onSuccess: (data, planId) => {
      const plan = subscriptionPlans?.find(p => p.id === planId);
      setSelectedPlan(plan || null);
      setShowPaymentModal(true);
      
      // Refresh profile data
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (error: any) => {
      // Show error in a more user-friendly way
      setShowConfirmModal(false);
      // You could add a toast notification here instead
    },
  });

  const handleSubscribe = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowConfirmModal(true);
  };

  const confirmSubscription = () => {
    if (selectedPlan) {
      subscribeMutation.mutate(selectedPlan.id);
      setShowConfirmModal(false);
    }
  };

  const isLoading = profileLoading || plansLoading;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}> 
          <Text style={styles.title}>{t('subscriptions.title')}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('subscriptions.title')}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load subscription plans</Text>
          <Button
            title="Try Again"
            onPress={() => window.location.reload()}
            style={styles.retryButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Debug logging - check the full response structure
  console.log('Full userProfile response:', userProfile);
  
  // Now the API returns the payload directly
  const profile = userProfile;
  const hasActiveSubscription = profile?.subscriptionSummary?.hasActiveSubscription || 
                               profile?.currentSubscription?.status === 'ACTIVE' ||
                               profile?.subscriptionDetails?.isActive;
  const isFreeTrial = profile?.subscriptionSummary?.isFreeTrial;

  // Debug logging
  console.log('Profile data:', profile);
  console.log('Has active subscription:', hasActiveSubscription);
  console.log('Subscription summary:', profile?.subscriptionSummary);
  console.log('Current subscription:', profile?.currentSubscription);

  // Format dates for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('subscriptions.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
        >
          {(hasActiveSubscription || profile?.currentSubscription) && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400 }}
            >
              <Card style={styles.currentSubscriptionCard}>
                <View style={styles.currentSubscriptionHeader}>
                  {isFreeTrial ? (
                    <Gift color={colors.warning} size={24} />
                  ) : (
                    <Crown color={colors.primary} size={24} />
                  )}
                  <View style={styles.currentSubscriptionTitleContainer}>
                    <Text style={styles.currentSubscriptionTitle}>
                      {isFreeTrial ? t('subscriptions.currentSubscription.freeTrialActive') : t('subscriptions.currentSubscription.title')}
                    </Text>
                    <Text style={styles.currentSubscriptionName}>
                      {profile?.subscriptionFeatures?.planName || 
                       profile?.currentSubscription?.paymentMetadata?.planName ||
                       profile?.currentSubscription?.__plan__?.name ||
                       t('subscriptions.currentSubscription.planName')}
                    </Text>
                  </View>
                </View>
                
                {/* Plan Description */}
                <Text style={styles.currentSubscriptionDescription}>
                  {profile?.subscriptionFeatures?.planDescription || 
                   profile?.currentSubscription?.paymentMetadata?.planDescription || 
                   'No description available'}
                </Text>
                
                {/* Subscription Period Section */}
                <View style={styles.subscriptionPeriodSection}>
                  <Text style={styles.subscriptionPeriodTitle}>
                    {t('subscriptions.currentSubscription.subscriptionPeriod')}
                  </Text>
                  <View style={styles.subscriptionPeriodGrid}>
                    <View style={styles.subscriptionPeriodItem}>
                      <Calendar color={colors.primary} size={20} />
                      <View style={styles.subscriptionPeriodContent}>
                        <Text style={styles.subscriptionPeriodLabel}>
                          {t('subscriptions.currentSubscription.startDate')}
                        </Text>
                        <Text style={styles.subscriptionPeriodValue}>
                          {formatDate(profile?.currentSubscription?.startDate)}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.subscriptionPeriodItem}>
                      <Clock color={colors.warning} size={20} />
                      <View style={styles.subscriptionPeriodContent}>
                        <Text style={styles.subscriptionPeriodLabel}>
                          {isFreeTrial ? t('subscriptions.currentSubscription.trialEnds') : t('subscriptions.currentSubscription.endDate')}
                        </Text>
                        <Text style={styles.subscriptionPeriodValue}>
                          {formatDate(profile?.currentSubscription?.endDate)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                
                <View style={styles.currentSubscriptionDetails}>
                  <View style={styles.currentSubscriptionDetail}>
                    <Text style={styles.currentSubscriptionLabel}>{t('subscriptions.currentSubscription.status')}:</Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: profile?.subscriptionDetails?.status === 'ACTIVE' ? colors.success + '20' : colors.warning + '20' }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: profile?.subscriptionDetails?.status === 'ACTIVE' ? colors.success : colors.warning }
                      ]}>
                        {profile?.subscriptionDetails?.status}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.currentSubscriptionDetail}>
                    <Text style={styles.currentSubscriptionLabel}>
                      {isFreeTrial ? t('subscriptions.currentSubscription.daysLeft') : t('subscriptions.currentSubscription.amount')}:
                    </Text>
                    <Text style={styles.currentSubscriptionValue}>
                      {isFreeTrial 
                        ? `${profile?.subscriptionDetails?.daysRemaining || 0} days`
                        : `RWF ${profile?.subscriptionFeatures?.planAmount || 
                             profile?.currentSubscription?.amountPaid ||
                             profile?.currentSubscription?.__plan__?.amount || 0}`
                      }
                    </Text>
                  </View>
                </View>
                
                {/* Plan Features */}
                <View style={styles.planFeaturesSection}>
                  <Text style={styles.planFeaturesTitle}>Plan Features:</Text>
                  <View style={styles.planFeaturesGrid}>
                    <View style={styles.planFeatureItem}>
                      <Text style={styles.planFeatureLabel}>Max Debts:</Text>
                      <Text style={styles.planFeatureValue}>
                        {profile?.subscriptionFeatures?.maxDebtsAllowed || 
                         profile?.currentSubscription?.paymentMetadata?.features?.maxDebtsAllowed ||
                         profile?.currentSubscription?.__plan__?.features?.maxDebtsAllowed || 0}
                      </Text>
                    </View>
                    
                    <View style={styles.planFeatureItem}>
                      <Text style={styles.planFeatureLabel}>Trustability Checks:</Text>
                      <Text style={styles.planFeatureValue}>
                        {profile?.subscriptionFeatures?.maxTrustabilityChecks || 
                         profile?.currentSubscription?.paymentMetadata?.features?.maxTrustabilityChecks ||
                         profile?.currentSubscription?.__plan__?.features?.maxTrustabilityChecks || 0}
                      </Text>
                    </View>
                    
                    <View style={styles.planFeatureItem}>
                      <Text style={styles.planFeatureLabel}>Max Devices:</Text>
                      <Text style={styles.planFeatureValue}>
                        {profile?.subscriptionFeatures?.maxDevices || 
                         profile?.currentSubscription?.paymentMetadata?.features?.maxDevices ||
                         profile?.currentSubscription?.__plan__?.features?.maxDevices || 0}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Usage Tracking */}
                {profile?.currentSubscription?.usageTracking && (
                  <View style={styles.usageTrackingSection}>
                    <Text style={styles.usageTrackingTitle}>Current Usage:</Text>
                    <View style={styles.usageTrackingGrid}>
                      <View style={styles.usageTrackingItem}>
                        <Text style={styles.usageTrackingLabel}>Debts Created:</Text>
                        <View style={styles.usageTrackingValueContainer}>
                          <Text style={styles.usageTrackingValue}>
                            {profile.currentSubscription.usageTracking.debtsCreated}
                          </Text>
                          <Text style={styles.usageTrackingRemaining}>
                            / {profile?.subscriptionFeatures?.maxDebtsAllowed || 
                                profile?.currentSubscription?.paymentMetadata?.features?.maxDebtsAllowed ||
                                profile?.currentSubscription?.__plan__?.features?.maxDebtsAllowed || 0} allowed
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.usageTrackingItem}>
                        <Text style={styles.usageTrackingLabel}>Trustability Checks:</Text>
                        <View style={styles.usageTrackingValueContainer}>
                          <Text style={styles.usageTrackingValue}>
                            {profile.currentSubscription.usageTracking.trustabilityChecksUsed}
                          </Text>
                          <Text style={styles.usageTrackingRemaining}>
                            / {profile?.subscriptionFeatures?.maxTrustabilityChecks || 
                                profile?.currentSubscription?.paymentMetadata?.features?.maxTrustabilityChecks ||
                                profile?.currentSubscription?.__plan__?.features?.maxTrustabilityChecks || 0} allowed
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )}
                
                <View style={styles.currentSubscriptionFeatures}>
                  <Text style={styles.currentSubscriptionFeaturesTitle}>{t('subscriptions.benefits.title')}:</Text>
                  <View style={styles.currentSubscriptionFeaturesList}>
                    <View style={styles.currentSubscriptionFeatureItem}>
                      <Check color={colors.success} size={16} />
                      <Text style={styles.currentSubscriptionFeatureText}>
                        {profile?.subscriptionFeatures?.maxTrustabilityChecks || 
                         profile?.currentSubscription?.paymentMetadata?.features?.maxTrustabilityChecks ||
                         profile?.currentSubscription?.__plan__?.features?.maxTrustabilityChecks || 0} {t('subscriptions.benefits.trustabilityChecks')}
                      </Text>
                    </View>
                    <View style={styles.currentSubscriptionFeatureItem}>
                      <Check color={colors.success} size={16} />
                      <Text style={styles.currentSubscriptionFeatureText}>
                        {profile?.subscriptionFeatures?.maxDebtsAllowed || 
                         profile?.currentSubscription?.paymentMetadata?.features?.maxDebtsAllowed ||
                         profile?.currentSubscription?.__plan__?.features?.maxDebtsAllowed || 0} {t('subscriptions.benefits.debtsAllowed')}
                      </Text>
                    </View>
                    <View style={styles.currentSubscriptionFeatureItem}>
                      <Check color={colors.success} size={16} />
                      <Text style={styles.currentSubscriptionFeatureText}>
                        {profile?.subscriptionFeatures?.maxDevices || 
                         profile?.currentSubscription?.paymentMetadata?.features?.maxDevices ||
                         profile?.currentSubscription?.__plan__?.features?.maxDevices || 0} {t('subscriptions.benefits.devices')}
                      </Text>
                    </View>
                  </View>
                </View>
                
                {/* Free Trial Specific Info */}
                {isFreeTrial && (
                  <View style={styles.freeTrialInfo}>
                    <Clock color={colors.warning} size={20} />
                    <Text style={styles.freeTrialText}>
                      {profile?.subscriptionSummary?.message || t('subscriptions.freeTrial.message')}
                    </Text>
                  </View>
                )}
              </Card>
            </MotiView>
          )}

          <Text style={styles.subtitle}>
            {hasActiveSubscription ? t('subscriptions.upgrade.title') : t('subscriptions.upgrade.choosePlan')}
          </Text>

          {subscriptionPlans?.map((plan, index) => {
            // Don't show subscribe button if user already has this plan active
            const isCurrentPlan = profile?.currentSubscription?.planId === plan.id;
            
            return (
              <MotiView
                key={plan.id}
                from={{ opacity: 0, translateY: 30 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  type: 'timing',
                  duration: 400,
                  delay: index * 100,
                }}
              >
                <Card style={styles.planCard}>
                  <View style={styles.planHeader}>
                    <View style={styles.planTitleContainer}>
                      <Text style={styles.planName}>{plan.name}</Text>
                      {plan.name.toLowerCase().includes('premium') && (
                        <Crown color={colors.warning} size={20} />
                      )}
                    </View>
                    <Text style={styles.planDescription}>{plan.description}</Text>
                  </View>

                  <View style={styles.planPrice}>
                    <Text style={styles.currency}>RWF</Text>
                    <Text style={styles.amount}>{plan.amount}</Text>
                    <Text style={styles.duration}>/{plan.durationInDays} days</Text>
                  </View>

                  <View style={styles.featuresContainer}>
                    <Text style={styles.featuresTitle}>{t('subscriptions.plan.features')}:</Text>
                    <View style={styles.featuresList}>
                      <View style={styles.featureItem}>
                        <Check color={colors.success} size={16} />
                        <Text style={styles.featureText}>
                          {plan.features.maxTrustabilityChecks} {t('subscriptions.benefits.trustabilityChecks')}
                        </Text>
                      </View>
                      <View style={styles.featureItem}>
                        <Check color={colors.success} size={16} />
                        <Text style={styles.featureText}>
                          {plan.features.maxDebtsAllowed} {t('subscriptions.benefits.debtsAllowed')}
                        </Text>
                      </View>
                      <View style={styles.featureItem}>
                        <Check color={colors.success} size={16} />
                        <Text style={styles.featureText}>
                          {plan.features.maxDevices} {t('subscriptions.benefits.devices')}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Only show subscribe button if not current plan */}
                  {!isCurrentPlan && (
                    <Button
                      title={t('subscriptions.plan.subscribeNow')}
                      onPress={() => handleSubscribe(plan)}
                      loading={subscribeMutation.isPending}
                      disabled={subscribeMutation.isPending}
                      style={styles.subscribeButton}
                    />
                  )}

                  {/* Show current plan indicator */}
                  {isCurrentPlan && (
                    <View style={styles.currentPlanIndicator}>
                      <Check color={colors.success} size={20} />
                      <Text style={styles.currentPlanText}>{t('subscriptions.plan.currentPlan')}</Text>
                    </View>
                  )}
                </Card>
              </MotiView>
            );
          })}

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>{t('subscriptions.help.title')}</Text>
            <Text style={styles.infoText}>
              {t('subscriptions.help.text')}
            </Text>
          </View>
        </MotiView>
      </ScrollView>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isVisible={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmSubscription}
        title={t('subscriptions.confirm.title')}
        message={t('subscriptions.confirm.message', { planName: selectedPlan?.name || 'this plan' })}
        confirmText={t('subscriptions.confirm.subscribe')}
        cancelText={t('common.cancel')}
        icon={<AlertCircle color={colors.primary} size={24} />}
        iconColor={colors.primary}
      />

      {/* Payment Instructions Modal */}
      <PaymentInstructionsModal
        isVisible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={selectedPlan?.amount || '0'}
        phoneNumber={user?.phoneNumber || 'your phone'}
      />
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
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
    },
    title: {
      fontSize: Typography.fontSize.xxl,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      flex: 1,
    },
    content: {
      flex: 1,
      paddingHorizontal: Spacing.md,
    },
    subtitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: Spacing.xl,
    },
    planCard: {
      marginBottom: Spacing.lg,
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
    planHeader: {
      marginBottom: Spacing.md,
    },
    planTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    planName: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginRight: Spacing.sm,
    },
    planDescription: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      lineHeight: 22,
    },
    planPrice: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: Spacing.lg,
      paddingVertical: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    currency: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.textSecondary,
      marginRight: Spacing.xs,
    },
    amount: {
      fontSize: Typography.fontSize.xxxl,
      fontFamily: 'DMSans-Bold',
      color: colors.primary,
      marginRight: Spacing.xs,
    },
    duration: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
    },
    featuresContainer: {
      marginBottom: Spacing.lg,
    },
    featuresTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    featuresList: {
      gap: Spacing.sm,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    featureText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.text,
      marginLeft: Spacing.sm,
    },
    subscribeButton: {
      width: '100%',
    },
    paymentInstructionsContainer: {
      marginTop: Spacing.lg,
      paddingTop: Spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    paymentInstructionsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    paymentInstructionsTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Bold',
      color: colors.primary,
      marginLeft: Spacing.sm,
    },
    paymentInstructionsText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.text,
      lineHeight: 22,
      marginBottom: Spacing.md,
    },
    ussdContainer: {
      marginBottom: Spacing.md,
    },
    ussdItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
      padding: Spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: 8,
    },
    ussdLabel: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.text,
      marginLeft: Spacing.sm,
      marginRight: Spacing.sm,
      minWidth: 50,
    },
    ussdCode: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Bold',
      color: colors.primary,
      backgroundColor: colors.primary + '10',
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: 6,
    },
    ussdInstructions: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: Spacing.md,
      fontStyle: 'italic',
    },
    paymentInstructionsFooter: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      lineHeight: 22,
      marginBottom: Spacing.md,
    },

    infoCard: {
      backgroundColor: colors.surface,
      padding: Spacing.lg,
      borderRadius: 12,
      marginBottom: Spacing.xl,
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    infoText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      lineHeight: 22,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
    },
    errorText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.error,
      textAlign: 'center',
      marginBottom: Spacing.lg,
    },
    retryButton: {
      minWidth: 120,
    },
    currentSubscriptionCard: {
      marginBottom: Spacing.lg,
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
    currentSubscriptionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    currentSubscriptionTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginLeft: Spacing.sm,
    },
    currentSubscriptionName: {
      fontSize: Typography.fontSize.xxl,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: Spacing.sm,
    },
    currentSubscriptionDetails: {
      flexDirection: 'column',
      alignItems:'flex-start',
      justifyContent: 'space-around',
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    currentSubscriptionDetail: {
      alignItems: 'flex-start',
    },
    currentSubscriptionLabel: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    currentSubscriptionValue: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-Bold',
      color: colors.primary,
    },
    statusBadge: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: 8,
    },
    statusText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
    },
    currentSubscriptionFeatures: {
      marginTop: Spacing.sm,
    },
    currentSubscriptionFeaturesTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    currentSubscriptionFeaturesList: {
      gap: Spacing.sm,
    },
    currentSubscriptionFeatureItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    currentSubscriptionFeatureText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.text,
      marginLeft: Spacing.sm,
    },
    usageTrackingSection: {
      marginTop: Spacing.lg,
      paddingTop: Spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    usageTrackingTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    usageTrackingGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      gap: Spacing.sm,
    },
    usageTrackingItem: {
      alignItems: 'center',
    },
    usageTrackingLabel: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    usageTrackingValue: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-Bold',
      color: colors.primary,
      marginBottom: Spacing.xs,
    },
    usageTrackingRemaining: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
    },
    freeTrialInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: Spacing.sm,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    freeTrialText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      marginLeft: Spacing.sm,
      lineHeight: 22,
    },
    subscriptionPeriodSection: {
      marginTop: Spacing.lg,
      paddingTop: Spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    subscriptionPeriodTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    subscriptionPeriodGrid: {
      flexDirection: 'column',
      gap: Spacing.sm,
    },
    subscriptionPeriodItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      backgroundColor: colors.surface,
      borderRadius: 8,
    },
    subscriptionPeriodContent: {
      marginLeft: Spacing.sm,
      flex: 1,
    },
    subscriptionPeriodLabel: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    subscriptionPeriodValue: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-Bold',
      color: colors.primary,
    },
    currentPlanIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: Spacing.sm,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    currentPlanText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      marginLeft: Spacing.sm,
    },
    // New styles for enhanced subscription display
    currentSubscriptionTitleContainer: {
      flex: 1,
      marginLeft: Spacing.md,
    },
    currentSubscriptionDescription: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      marginTop: Spacing.sm,
      lineHeight: 20,
    },
    planFeaturesSection: {
      marginTop: Spacing.lg,
      paddingTop: Spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    planFeaturesTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    planFeaturesGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      gap: Spacing.sm,
    },
    planFeatureItem: {
      alignItems: 'center',
      flex: 1,
    },
    planFeatureLabel: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
      textAlign: 'center',
    },
    planFeatureValue: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-Bold',
      color: colors.primary,
    },
    usageTrackingValueContainer: {
      alignItems: 'center',
    },
  });
