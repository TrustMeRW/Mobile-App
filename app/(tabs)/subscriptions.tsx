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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Typography, Spacing } from '@/constants/theme';
import { apiClient } from '@/services/api';
import { SubscriptionPlan } from '@/types/api';
import { MotiView } from 'moti';
import { ChevronLeft, Check, Crown, Phone, Info } from 'lucide-react-native';

export default function SubscriptionsScreen() {
  const { colors } = useTheme();
  const { user } = useAuthContext();
  const styles = getStyles(colors);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: subscriptionPlans, isLoading, error } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => apiClient.getActiveSubscriptionPlans(),
  });

  const subscribeMutation = useMutation({
    mutationFn: (planId: string) => apiClient.subscribeToPlan(planId),
    onSuccess: (data, planId) => {
      const plan = subscriptionPlans?.find(p => p.id === planId);
      const amount = plan?.amount || '0';
      setExpandedPlan(planId);
      
      Alert.alert(
        'Payment Initiated Successfully!',
        `You will shortly be prompted to pay RWF ${amount} on your telephone number ${user?.phoneNumber || 'your phone'}. If you do not get the prompt, you can press *182*7*1# and follow the instructions.`,
        [{ text: 'OK' }]
      );
    },
    onError: (error: any) => {
      Alert.alert(
        'Payment Failed',
        error.message || 'Failed to initiate payment. Please try again.',
        [{ text: 'OK' }]
      );
    },
  });

  const handleSubscribe = (planId: string) => {
    Alert.alert(
      'Confirm Subscription',
      'Are you sure you want to subscribe to this plan? ',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Subscribe',
          style: 'default',
          onPress: () => {
            subscribeMutation.mutate(planId);
          },
        },
      ]
    );
  };



  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft color={colors.text} size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Subscription Plans</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={48} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft color={colors.text} size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Subscription Plans</Text>
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Subscription Plans</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
        >
          {/* Current Subscription Section */}
          {user?.userSubscription && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400 }}
            >
              <Card style={styles.currentSubscriptionCard}>
                <View style={styles.currentSubscriptionHeader}>
                  <Crown color={colors.primary} size={24} />
                  <Text style={styles.currentSubscriptionTitle}>
                    Current Subscription
                  </Text>
                </View>
                
                <Text style={styles.currentSubscriptionName}>
                  {user.userSubscription.planName}
                </Text>
                
                <View style={styles.currentSubscriptionDetails}>
                  <View style={styles.currentSubscriptionDetail}>
                    <Text style={styles.currentSubscriptionLabel}>Status:</Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: user.userSubscription.status === 'ACTIVE' ? colors.success + '20' : colors.warning + '20' }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: user.userSubscription.status === 'ACTIVE' ? colors.success : colors.warning }
                      ]}>
                        {user.userSubscription.status}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.currentSubscriptionDetail}>
                    <Text style={styles.currentSubscriptionLabel}>Ends:</Text>
                    <Text style={styles.currentSubscriptionValue}>
                      {new Date(user.userSubscription.endDate).toLocaleDateString()}
                    </Text>
                  </View>
                  
                  <View style={styles.currentSubscriptionDetail}>
                    <Text style={styles.currentSubscriptionLabel}>Amount:</Text>
                    <Text style={styles.currentSubscriptionValue}>
                      RWF {user.userSubscription.amount}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.currentSubscriptionFeatures}>
                  <Text style={styles.currentSubscriptionFeaturesTitle}>Your Benefits:</Text>
                  <View style={styles.currentSubscriptionFeaturesList}>
                    <View style={styles.currentSubscriptionFeatureItem}>
                      <Check color={colors.success} size={16} />
                      <Text style={styles.currentSubscriptionFeatureText}>
                        {user.userSubscription.features.maxTrustabilityChecks} Trustability Checks
                      </Text>
                    </View>
                    <View style={styles.currentSubscriptionFeatureItem}>
                      <Check color={colors.success} size={16} />
                      <Text style={styles.currentSubscriptionFeatureText}>
                        {user.userSubscription.features.maxDebtsAllowed} Debts Allowed
                      </Text>
                    </View>
                    <View style={styles.currentSubscriptionFeatureItem}>
                      <Check color={colors.success} size={16} />
                      <Text style={styles.currentSubscriptionFeatureText}>
                        {user.userSubscription.features.maxDevices} Devices
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            </MotiView>
          )}

          <Text style={styles.subtitle}>
            {user?.userSubscription ? 'Upgrade or change your subscription plan' : 'Choose the plan that best fits your needs'}
          </Text>

          {subscriptionPlans?.map((plan, index) => (
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
                  <Text style={styles.featuresTitle}>Features:</Text>
                  <View style={styles.featuresList}>
                    <View style={styles.featureItem}>
                      <Check color={colors.success} size={16} />
                      <Text style={styles.featureText}>
                        {plan.features.maxTrustabilityChecks} Trustability Checks
                      </Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Check color={colors.success} size={16} />
                      <Text style={styles.featureText}>
                        {plan.features.maxDebtsAllowed} Debts Allowed
                      </Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Check color={colors.success} size={16} />
                      <Text style={styles.featureText}>
                        {plan.features.maxDevices} Devices
                      </Text>
                    </View>
                  </View>
                </View>

                <Button
                  title="Subscribe Now"
                  onPress={() => handleSubscribe(plan.id)}
                  loading={subscribeMutation.isPending}
                  disabled={subscribeMutation.isPending}
                  style={styles.subscribeButton}
                />

                {/* Payment Instructions - Only shown after successful subscription */}
                {expandedPlan === plan.id && (
                  <MotiView
                    from={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ type: 'timing', duration: 300 }}
                    style={styles.paymentInstructionsContainer}
                  >
                    <View style={styles.paymentInstructionsHeader}>
                      <Info color={colors.primary} size={20} />
                      <Text style={styles.paymentInstructionsTitle}>
                        Payment Instructions
                      </Text>
                    </View>
                    
                    <Text style={styles.paymentInstructionsText}>
                      You will shortly be prompted to pay RWF {plan.amount} on your telephone number {user?.phoneNumber || 'your phone'}. If you do not get the prompt, you can use the following USSD codes:
                    </Text>

                    <View style={styles.ussdContainer}>
                      <View style={styles.ussdItem}>
                        <Phone color={colors.success} size={16} />
                        <Text style={styles.ussdLabel}>MTN:</Text>
                        <Text style={styles.ussdCode}>*182*7*1#</Text>
                      </View>
                      <View style={styles.ussdItem}>
                        <Phone color={colors.info} size={16} />
                        <Text style={styles.ussdLabel}>Airtel:</Text>
                        <Text style={styles.ussdCode}>*182*6*1#</Text>
                      </View>
                    </View>
                    
                    <Text style={styles.ussdInstructions}>
                      Press the code for your network and follow the instructions to complete payment.
                    </Text>

                    <Text style={styles.paymentInstructionsFooter}>
                      Follow the prompts to complete your payment. Your subscription will be activated once payment is confirmed.
                    </Text>
                  </MotiView>
                )}
              </Card>
            </MotiView>
          ))}

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Need Help?</Text>
            <Text style={styles.infoText}>
              If you have any questions about our subscription plans or need assistance, 
              please contact our support team.
            </Text>
          </View>
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
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: Typography.fontSize.xxl,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      textAlign: 'center',
      flex: 1,
    },
    content: {
      flex: 1,
      paddingHorizontal: Spacing.lg,
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
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: Spacing.sm,
    },
    currentSubscriptionDetail: {
      alignItems: 'center',
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
  });
