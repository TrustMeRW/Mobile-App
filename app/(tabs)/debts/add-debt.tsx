import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/contexts/TranslationContext';
import { useToast } from '@/contexts/ToastContext';
import { useCurrentUser, useCreateDebt } from '@/hooks';
import { apiClient, type Debt, type User } from '@/services/api';
import {
  Spacing,
  Typography,
  BorderRadius,
} from '@/constants/theme';
import { MotiView } from 'moti';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Trash2,
  QrCode,
  User as UserIcon,
  Calendar,
  Package,
  DollarSign,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react-native';
import QRCodeScanner from '@/components/QRCodeScanner';
import UserTrustabilityDisplay from '@/components/UserTrustabilityDisplay';

interface DebtItem {
  name: string;
  description: string;
  quantity: number;
  amount: number;
}

interface DebtFormData {
  items: DebtItem[];
  dueDate: Date | null;
  selectedUser: {
    id: string;
    fullName: string;
    trustabilityPercentage: number;
  } | null;
  intiationType: 'REQUEST' | 'offer';
}

interface UserTrustabilityData {
  userId: string;
  fullName: string;
  trustabilityPercentage: number;
  possiblePayments: number;
  completedPayments: number;
  paymentSuccessRate: number;
  paymentPatterns: {
    prefersInstallments: boolean;
    installmentPaymentRate: number;
    averageInstallments: number;
    prefersImmediatePayment: boolean;
    immediatePaymentRate: number;
  };
  recommendedDebtRanges: Array<{
    range: string;
    count: number;
    paymentRate: number;
    averagePaymentPeriod: number;
    isRecommended: boolean;
  }>;
  nonRecommendedDebtRanges: Array<{
    range: string;
    count: number;
    paymentRate: number;
    averagePaymentPeriod: number;
    isRecommended: boolean;
  }>;
  location: {
    province: string;
    district: string;
    sector: string;
    cell: string;
    village: string;
  };
  analyzedAt: string;
}

export default function AddDebtScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();
  const { user: currentUser } = useCurrentUser();
  const router = useRouter();
  const queryClient = useQueryClient();
  const styles = getStyles(colors);

  const [currentStep, setCurrentStep] = useState(0);
  const [showScanner, setShowScanner] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [scannedUserData, setScannedUserData] = useState<UserTrustabilityData | null>(null);
  const [manualUserCode, setManualUserCode] = useState('');
  const [isPendingRequest, setIsPendingRequest] = useState(false);
  const [debtForm, setDebtForm] = useState<DebtFormData>({
    items: [{ name: '', description: '', quantity: 1, amount: 0 }],
    dueDate: null,
    selectedUser: null,
    intiationType: 'REQUEST',
  });

  // Safety check for user
  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.errorText}>{t('addDebt.errors.userNotAuthenticated')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const createDebtMutation = useCreateDebt();

  // Handle successful debt creation
  useEffect(() => {
    if (createDebtMutation.isSuccess) {
      router.back();
    }
  }, [createDebtMutation.isSuccess, router]);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDebtTypeChange = (type: 'REQUEST' | 'offer') => {
    setDebtForm(prev => ({ ...prev, intiationType: type }));
  };

  const addItem = () => {
    setDebtForm(prev => ({
      ...prev,
      items: [...prev.items, { name: '', description: '', quantity: 1, amount: 0 }],
    }));
  };

  const removeItem = (index: number) => {
    if (debtForm.items.length > 1) {
      setDebtForm(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const updateItem = (index: number, field: keyof DebtItem, value: string | number) => {
    setDebtForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleQRCodeScan = async (code: string) => {
    // Check if there's already a pending request
    if (isPendingRequest) {
      showError(
        'Request in Progress',
        'Please wait for the current request to complete before scanning another QR code.'
      );
      return;
    }

    try {
      setIsPendingRequest(true);
      const response = await apiClient.getUserTrustabilityAnalyticsByCode(code);
      setScannedUserData(response.payload);
      setShowScanner(false);
      setCurrentStep(2); // Move to user display step
    } catch (error: any) {
      console.error('QR Code scan error:', error);
      showError(
        'QR Code Scan Failed',
        error.message || 'Failed to fetch user data. Please try again.'
      );
      setShowScanner(false);
    } finally {
      setIsPendingRequest(false);
    }
  };

  const handleProceed = () => {
    if (scannedUserData) {
      setDebtForm(prev => ({
        ...prev,
        selectedUser: {
          id: scannedUserData.userId,
          fullName: scannedUserData.fullName,
          trustabilityPercentage: scannedUserData.trustabilityPercentage,
        },
      }));
      setCurrentStep(3); // Move to review step
    }
  };

  const handleCancel = () => {
    setScannedUserData(null);
    setManualUserCode('');
    setIsPendingRequest(false);
    setCurrentStep(0); // Go back to step 1
  };

  const handleManualCodeSubmit = async () => {
    if (!manualUserCode.trim()) {
      showError('Invalid Code', 'Please enter a valid user code.');
      return;
    }

    // Check if there's already a pending request
    if (isPendingRequest) {
      showError(
        'Request in Progress',
        'Please wait for the current request to complete before submitting another code.'
      );
      return;
    }

    try {
      setIsPendingRequest(true);
      const response = await apiClient.getUserTrustabilityAnalyticsByCode(manualUserCode.trim());
      setScannedUserData(response.payload);
      setManualUserCode('');
      setCurrentStep(2); // Move to user display step
    } catch (error: any) {
      console.error('Manual code scan error:', error);
      showError(
        'Code Submission Failed',
        error.message || 'Failed to fetch user data. Please try again.'
      );
    } finally {
      setIsPendingRequest(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    
    if (selectedDate) {
      // Ensure the selected date is from tomorrow onwards
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      if (selectedDate >= tomorrow) {
        setDebtForm(prev => ({ ...prev, dueDate: selectedDate }));
      } else {
        showError(
          'Invalid Date',
          'Please select a date from tomorrow onwards.'
        );
      }
    }
  };

  const handleSubmit = () => {
    if (!debtForm.selectedUser) {
      showError('Error', 'Please select a user first');
      return;
    }

    const hasEmptyFields = debtForm.items.some(
      item => !item.name || item.amount <= 0
    );

    if (hasEmptyFields) {
      showError('Error', 'Please fill in all item details');
      return;
    }

    createDebtMutation.mutate(debtForm);
  };

  const resetForm = () => {
    setDebtForm({
      items: [{ name: '', description: '', quantity: 1, amount: 0 }],
      dueDate: null,
      selectedUser: null,
      intiationType: 'REQUEST',
    });
    setCurrentStep(0);
    setScannedUserData(null);
    setManualUserCode('');
    setShowDatePicker(false);
    setIsPendingRequest(false);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <Package color={colors.primary} size={24} />
                <Text style={styles.stepTitle}>{t('addDebt.steps.debtType.title')}</Text>
              </View>
              <Text style={styles.stepSubtext}>
                {t('addDebt.steps.debtType.subtitle')}
              </Text>

              <View style={styles.debtTypeOptions}>
                <TouchableOpacity
                  style={[
                    styles.debtTypeOption,
                    debtForm.intiationType === 'REQUEST' && styles.debtTypeOptionActive
                  ]}
                  onPress={() => handleDebtTypeChange('REQUEST')}
                >
                  <View style={styles.debtTypeContent}>
                    <Text style={[
                      styles.debtTypeTitle,
                      debtForm.intiationType === 'REQUEST' && styles.debtTypeTitleActive
                    ]}>
                      {t('addDebt.steps.debtType.request.title')}
                    </Text>
                    <Text style={[
                      styles.debtTypeSubtext,
                      debtForm.intiationType === 'REQUEST' && styles.debtTypeSubtextActive
                    ]}>
                      {t('addDebt.steps.debtType.request.subtitle')}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.debtTypeOption,
                    debtForm.intiationType === 'offer' && styles.debtTypeOptionActive
                  ]}
                  onPress={() => handleDebtTypeChange('offer')}
                >
                  <View style={styles.debtTypeContent}>
                    <Text style={[
                      styles.debtTypeTitle,
                      debtForm.intiationType === 'offer' && styles.debtTypeTitleActive
                    ]}>
                      {t('addDebt.steps.debtType.offer.title')}
                    </Text>
                    <Text style={[
                      styles.debtTypeSubtext,
                      debtForm.intiationType === 'offer' && styles.debtTypeSubtextActive
                    ]}>
                      {t('addDebt.steps.debtType.offer.subtitle')}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </Card>
        );

      case 1:
        return (
          <View>
            <Card style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <Package color={colors.primary} size={24} />
                <Text style={styles.stepTitle}>{t('addDebt.steps.products.title')}</Text>
              </View>
              <Text style={styles.stepSubtext}>
                {t('addDebt.steps.products.subtitle')}
              </Text>

            {debtForm.items.map((item, index) => (
              <View key={index} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemNumberContainer}>
                    <Text style={styles.itemNumber}>{t('addDebt.steps.products.item', { number: index + 1 })}</Text>
                    <View style={styles.itemStatus}>
                      {item.name && item.amount > 0 ? (
                        <CheckCircle color={colors.success} size={16} />
                      ) : (
                        <AlertTriangle color={colors.warning} size={16} />
                      )}
                    </View>
                  </View>
                  {debtForm.items.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeItem(index)}
                      style={styles.removeButton}
                    >
                      <Trash2 color={colors.error} size={16} />
                    </TouchableOpacity>
                  )}
                </View>

                <Input
                  label={t('addDebt.steps.products.name')}
                  placeholder={t('addDebt.steps.products.namePlaceholder')}
                  value={item.name}
                  onChangeText={(value) => updateItem(index, 'name', value)}
                  style={styles.itemInput}
                />

                <Text style={styles.descriptionLabel}>{t('addDebt.steps.products.description')}</Text>
                <TextInput
                  placeholder={t('addDebt.steps.products.descriptionPlaceholder')}
                  value={item.description}
                  onChangeText={(value) => updateItem(index, 'description', value)}
                  style={styles.descriptionInput}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  placeholderTextColor={colors.textSecondary}
                />

                <View style={styles.itemRow}>
                  <View style={styles.itemInputHalf}>
                    <Input
                      label={t('addDebt.steps.products.quantity')}
                      placeholder={t('addDebt.steps.products.quantityPlaceholder')}
                      value={item.quantity.toString()}
                      onChangeText={(value) => updateItem(index, 'quantity', parseInt(value) || 1)}
                      keyboardType="numeric"
                      style={styles.itemInput}
                    />
                  </View>
                  <View style={styles.itemInputHalf}>
                    <Input
                      label={t('addDebt.steps.products.amount')}
                      placeholder={t('addDebt.steps.products.amountPlaceholder')}
                      value={item.amount.toString()}
                      onChangeText={(value) => updateItem(index, 'amount', parseFloat(value) || 0)}
                      keyboardType="numeric"
                      style={styles.itemInput}
                    />
                  </View>
                </View>
                
                {/* Item Summary */}
                {item.name && item.amount > 0 && (
                  <View style={styles.itemSummary}>
                    <Text style={styles.itemSummaryText}>
                      {t('addDebt.steps.products.total', { amount: (item.quantity * item.amount).toLocaleString() })}
                    </Text>
                  </View>
                )}
              </View>
            ))}

            <TouchableOpacity style={styles.addItemButton} onPress={addItem}>
              <Plus color={colors.primary} size={20} />
              <Text style={styles.addItemText}>{t('addDebt.steps.products.addAnother')}</Text>
            </TouchableOpacity>
          </Card>

          {/* Payment Date Section - Separate Card */}
          <Card style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <Calendar color={colors.primary} size={24} />
              <Text style={styles.stepTitle}>{t('addDebt.steps.paymentDate.title')}</Text>
            </View>
            <Text style={styles.stepSubtext}>
              {t('addDebt.steps.paymentDate.subtitle')}
            </Text>
            
            <View style={styles.datePickerContainer}>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar color={colors.primary} size={18} />
                <Text style={styles.datePickerButtonText}>
                  {debtForm.dueDate ? debtForm.dueDate.toLocaleDateString() : t('addDebt.steps.paymentDate.selectDate')}
                </Text>
              </TouchableOpacity>
              
              {debtForm.dueDate && (
                <View style={styles.dateActionsContainer}>
                  <TouchableOpacity
                    style={styles.clearDateButton}
                    onPress={() => setDebtForm(prev => ({ ...prev, dueDate: null }))}
                  >
                    <Text style={styles.clearDateButtonText}>{t('addDebt.steps.paymentDate.clearDate')}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            
            {debtForm.dueDate && (
              <View style={styles.dateInfo}>
                <Text style={styles.dateInfoText}>
                  {t('addDebt.steps.paymentDate.paymentDue', { date: debtForm.dueDate.toLocaleDateString() })}
                </Text>
                <Text style={styles.dateInfoSubtext}>
                  {t('addDebt.steps.paymentDate.overdueNote')}
                </Text>
              </View>
            )}

            {/* Date Picker - Only rendered in step 1 */}
            {showDatePicker && (
              <DateTimePicker
                value={debtForm.dueDate || new Date()}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date(Date.now() + 24 * 60 * 60 * 1000)} // Tomorrow
              />
            )}
          </Card>
        </View>
        );

      case 2:
        if (scannedUserData) {
          return (
            <UserTrustabilityDisplay
              data={scannedUserData}
              onProceed={handleProceed}
              onCancel={handleCancel}
            />
          );
        }
        return (
          <Card style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <QrCode color={colors.primary} size={24} />
                <Text style={styles.stepTitle}>{t('addDebt.steps.scanUser.title')}</Text>
              </View>
              <Text style={styles.stepSubtext}>
                {debtForm.intiationType === 'REQUEST'
                  ? t('addDebt.steps.scanUser.requestSubtitle')
                  : t('addDebt.steps.scanUser.offerSubtitle')
                }
              </Text>
              <TouchableOpacity
                style={[
                  styles.scanButton,
                  isPendingRequest && styles.scanButtonDisabled
                ]}
                onPress={() => setShowScanner(true)}
                disabled={isPendingRequest}
                activeOpacity={0.8}
              >
                {isPendingRequest ? (
                  <LoadingSpinner size="small" color={colors.white} />
                ) : (
                  <QrCode color={colors.white} size={24} />
                )}
                <Text style={styles.scanButtonText}>
                  {isPendingRequest ? t('addDebt.steps.scanUser.scanning') : t('addDebt.steps.scanUser.scanButton')}
                </Text>
              </TouchableOpacity>
              
              {/* Manual Input Section */}
              <View style={styles.manualInputSection}>
                <Text style={styles.manualInputLabel}>{t('addDebt.steps.scanUser.manualInput')}</Text>
                <View style={styles.manualInputContainer}>
                  <Input
                    placeholder={t('addDebt.steps.scanUser.codePlaceholder')}
                    value={manualUserCode}
                    onChangeText={setManualUserCode}
                    style={styles.manualInput}
                  />
                  <TouchableOpacity
                    style={[
                      styles.manualSubmitButton,
                      isPendingRequest && styles.manualSubmitButtonDisabled
                    ]}
                    onPress={handleManualCodeSubmit}
                    disabled={!manualUserCode.trim() || isPendingRequest}
                    activeOpacity={0.8}
                  >
                    {isPendingRequest ? (
                      <LoadingSpinner size="small" color={colors.white} />
                    ) : (
                      <Text style={styles.manualSubmitButtonText}>{t('addDebt.steps.scanUser.fetchUser')}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
              
              <Text style={styles.scanInstructions}>
                Point your camera at the user's QR code to scan and view their trustability analytics
              </Text>
            </Card>
        );

      case 3:
        return (
          <Card style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <UserIcon color={colors.primary} size={24} />
                <Text style={styles.stepTitle}>Review & Confirm</Text>
              </View>
              <Text style={styles.stepSubtext}>
                Review all the details before creating the debt
              </Text>

              <View style={styles.reviewSection}>
                <Text style={styles.reviewTitle}>Debt Type</Text>
                <Text style={styles.reviewValue}>
                  {debtForm.intiationType === 'REQUEST' ? 'I Owe Someone' : 'Someone Owes Me'}
                </Text>
                <Text style={styles.reviewDescription}>
                  {debtForm.intiationType === 'REQUEST' 
                    ? 'You are requesting to borrow from this person'
                    : 'You are offering to lend to this person'
                  }
                </Text>
              </View>

              <View style={styles.reviewSection}>
                <Text style={styles.reviewTitle}>Selected User</Text>
                <Text style={styles.reviewValue}>{debtForm.selectedUser?.fullName}</Text>
                <Text style={styles.reviewDescription}>
                  Trustability Score: {debtForm.selectedUser?.trustabilityPercentage}%
                </Text>
              </View>

              <View style={styles.reviewSection}>
                <Text style={styles.reviewTitle}>Items</Text>
                {debtForm.items.map((item, index) => (
                  <View key={index} style={styles.reviewItem}>
                    <Text style={styles.reviewItemName}>
                      {item.name} (x{item.quantity})
                    </Text>
                    <Text style={styles.reviewItemAmount}>
                      RWF {item.amount.toLocaleString()}
                    </Text>
                  </View>
                ))}
                <Text style={styles.reviewTotal}>
                  Total: RWF {debtForm.items.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                </Text>
              </View>

              <View style={styles.reviewSection}>
                <Text style={styles.reviewTitle}>Due Date</Text>
                <Text style={styles.reviewValue}>
                  {debtForm.dueDate ? debtForm.dueDate.toLocaleDateString() : 'Not specified'}
                </Text>
                <Text style={styles.reviewDescription}>
                  {debtForm.dueDate 
                    ? `Payment due on ${debtForm.dueDate.toLocaleDateString()}`
                    : 'No due date set for this debt'
                  }
                </Text>
              </View>
            </Card>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 0:
        return 'Select Debt Type';
      case 1:
        return 'Add Products/Services';
      case 2:
        return 'Scan User';
      case 3:
        return 'Review & Confirm';
      default:
        return '';
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return debtForm.intiationType !== null;
      case 1:
        return debtForm.items.every(item => item.name && item.amount > 0);
      case 2:
        return scannedUserData !== null;
      case 3:
        return debtForm.selectedUser !== null;
      default:
        return false;
    }
  };

  const canGoBack = () => {
    return currentStep > 0;
  };

  if (createDebtMutation.isPending) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <Text style={styles.loadingText}>{t('addDebt.errors.creatingDebt')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('addDebt.title')}</Text>
        <View style={styles.placeholder} />
      </View>



      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <MotiView
          key={currentStep}
          from={{ opacity: 0, translateX: 50 }}
          animate={{ opacity: 1, translateX: 0 }}
          exit={{ opacity: 0, translateX: -50 }}
          transition={{ type: 'timing', duration: 400 }}
        >
          {renderStepContent()}
        </MotiView>
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        {canGoBack() && (
          <TouchableOpacity
            style={[styles.navButton, styles.previousButton]}
            onPress={handlePrevious}
            activeOpacity={0.8}
          >
            <ChevronLeft color={colors.primary} size={20} style={styles.navButtonIcon} />
            <Text style={[styles.navButtonText, { color: colors.primary }]}>{t('addDebt.navigation.previous')}</Text>
          </TouchableOpacity>
        )}
        {currentStep === 2 && scannedUserData ? (
          <TouchableOpacity
            style={[styles.navButton, styles.proceedButton]}
            onPress={handleNext}
            disabled={!canProceed()}
            activeOpacity={0.8}
          >
            <CheckCircle color={colors.white} size={20} style={styles.navButtonIcon} />
            <Text style={[styles.navButtonText, { color: colors.white }]}>{t('addDebt.navigation.proceed')}</Text>
          </TouchableOpacity>
        ) : currentStep < 3 ? (
          <TouchableOpacity
            style={[styles.navButton, styles.nextButton]}
            onPress={handleNext}
            disabled={!canProceed()}
            activeOpacity={0.8}
          >
            <ChevronRight color={colors.white} size={20} style={styles.navButtonIcon} />
            <Text style={[styles.navButtonText, { color: colors.white }]}>{t('addDebt.navigation.next')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navButton, styles.createButton]}
            onPress={handleSubmit}
            disabled={!canProceed()}
            activeOpacity={0.8}
          >
            <CheckCircle color={colors.white} size={20} style={styles.navButtonIcon} />
            <Text style={[styles.navButtonText, { color: colors.white }]}>{t('addDebt.navigation.createDebt')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* QR Code Scanner */}
      {showScanner && (
        <QRCodeScanner
          isVisible={showScanner}
          onScan={handleQRCodeScan}
          onClose={() => setShowScanner(false)}
          isPendingRequest={isPendingRequest}
        />
      )}
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
    },
    backButton: {
      marginRight: Spacing.md,
    },
    title: {
      fontSize: Typography.fontSize.xl,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
    },
    placeholder: {
      width: 40,
    },
    stepIndicatorContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.lg,
      paddingHorizontal: Spacing.lg,
    },
    stepIndicatorItem: {
      alignItems: 'center',
      flex: 1,
      maxWidth: 80,
    },
    stepIndicatorDot: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.xs,
    },
    stepIndicatorDotActive: {
      backgroundColor: colors.primary,
    },
    stepIndicatorDotInactive: {
      backgroundColor: colors.border,
    },
    stepIndicatorLine: {
      width: 2,
      height: 20,
      borderRadius: 1,
    },
    stepIndicatorLineActive: {
      backgroundColor: colors.primary,
    },
    stepIndicatorLineInactive: {
      backgroundColor: colors.border,
    },
    stepIndicator: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: Spacing.md,
      paddingHorizontal: Spacing.md,
    },
    stepDotContainer: {
      alignItems: 'center',
    },
    stepDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.border,
    },
    stepDotActive: {
      backgroundColor: colors.primary,
    },
    stepLine: {
      width: 1,
      height: 20,
      backgroundColor: colors.border,
      position: 'absolute',
      top: 20,
      left: 20,
    },
    stepLineActive: {
      backgroundColor: colors.primary,
    },
    content: {
      flex: 1,
      paddingHorizontal: Spacing.sm,
    },
    stepTitleText: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginBottom: Spacing.sm,
      paddingHorizontal: Spacing.lg,
    },
    stepCard: {
      marginBottom: Spacing.md,
      borderRadius: BorderRadius.lg,
      overflow: 'hidden',
      padding: Spacing.md,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    stepHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
      paddingBottom: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    stepTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginLeft: Spacing.sm,
    },
    stepSubtext: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      marginBottom: Spacing.md,
      paddingHorizontal: Spacing.sm,
    },
    stepDescription: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      marginTop: Spacing.xs,
      marginBottom: Spacing.lg,
      paddingHorizontal: Spacing.sm,
    },
    debtTypeOptions: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.primary,
      overflow: 'hidden',
    },
    debtTypeOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    debtTypeOptionActive: {
      backgroundColor: colors.primary,
    },
    debtTypeContent: {
      flex: 1,
    },
    debtTypeTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Bold',
      color: colors.primary,
    },
    debtTypeTitleActive: {
      color: colors.white,
    },
    debtTypeSubtext: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      marginTop: Spacing.xs,
    },
    debtTypeSubtextActive: {
      color: colors.white,
    },
    itemCard: {
      marginBottom: Spacing.md,
      borderRadius: BorderRadius.md,
      overflow: 'hidden',
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: Spacing.sm,
    },
    itemNumberContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    itemStatus: {
      marginLeft: Spacing.xs,
    },
    itemNumber: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.textSecondary,
    },
    removeButton: {
      padding: Spacing.sm,
    },
    itemInput: {
      marginBottom: Spacing.sm,
      paddingHorizontal: Spacing.sm,
    },
    descriptionInput: {
      marginBottom: Spacing.sm,
      paddingHorizontal: Spacing.sm,
      minHeight: 100,
      textAlignVertical: 'top',
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.text,
      backgroundColor: colors.card,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    itemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.sm,
      marginBottom: Spacing.sm,
      gap: Spacing.sm,
    },
    itemInputHalf: {
      flex: 1,
    },
    addItemButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      marginTop: Spacing.md,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    itemSummary: {
      backgroundColor: colors.success + '10',
      padding: Spacing.sm,
      borderRadius: BorderRadius.sm,
      marginTop: Spacing.sm,
      alignItems: 'center',
    },
    itemSummaryText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-SemiBold',
      color: colors.success,
    },
    addItemText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.primary,
      marginLeft: Spacing.sm,
    },
    scanButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      marginTop: Spacing.md,
      marginBottom: Spacing.md,
    },
    scanButtonText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.white,
      marginLeft: Spacing.sm,
    },
    scanButtonDisabled: {
      opacity: 0.7,
    },
    scanInstructions: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: Spacing.sm,
    },
    reviewSection: {
      marginBottom: Spacing.md,
      paddingHorizontal: Spacing.sm,
    },
    reviewTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    reviewValue: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-Bold',
      color: colors.primary,
      marginBottom: Spacing.xs,
    },
    reviewDescription: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
    },
    reviewItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '30',
    },
    reviewItemName: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.text,
    },
    reviewItemAmount: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Bold',
      color: colors.primary,
    },
    reviewTotal: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-Bold',
      color: colors.primary,
      marginTop: Spacing.md,
      textAlign: 'right',
    },
    navigation: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    navButton: {
      flex: 1,
      marginHorizontal: Spacing.xs,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.lg,
      minHeight: 48,
    },
    previousButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.primary,
    },
    nextButton: {
      backgroundColor: colors.primary,
    },
    proceedButton: {
      backgroundColor: colors.success,
    },
    createButton: {
      backgroundColor: colors.primary,
    },
    navButtonIcon: {
      marginRight: Spacing.xs,
    },
    navButtonText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-SemiBold',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    loadingText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      marginTop: Spacing.sm,
    },
    errorText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.error,
      textAlign: 'center',
      padding: Spacing.md,
    },
    manualInputSection: {
      marginTop: Spacing.md,
      paddingHorizontal: Spacing.sm,
    },
    manualInputLabel: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    manualInputContainer: {
      flexDirection: 'row',
      gap:Spacing.sm
    },
    manualInput: {
      flex: 1,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.text,
    },
    manualSubmitButton: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.md,
      alignItems:"center",
      height:"100%",
      borderLeftWidth: 1,
      borderLeftColor: colors.border,
    },
    manualSubmitButtonText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.white,
    },
    manualSubmitButtonDisabled: {
      opacity: 0.7,
    },
    datePickerContainer: {
      marginBottom: Spacing.sm,
      padding: Spacing.sm,
    },
    datePickerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.background,
      minHeight: 50,
    },
    datePickerButtonText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.primary,
      marginLeft: Spacing.sm,
      textAlign: 'center',
      flex: 1,
    },
    clearDateButton: {
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      backgroundColor: colors.error,
      borderRadius: BorderRadius.sm,
    },
    clearDateButtonText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
      color: colors.white,
    },
    dateInfo: {
      marginTop: Spacing.sm,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.sm,
      backgroundColor: colors.card,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dateInfoText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
      color: colors.text,
      textAlign: 'center',
    },
    dateInfoSubtext: {
      fontSize: Typography.fontSize.xs,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      marginTop: Spacing.xs,
      textAlign: 'center',
    },
    dateActionsContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: Spacing.sm,
    },
    paymentDateSection: {
      marginTop: Spacing.md,
      paddingHorizontal: Spacing.sm,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.xs,
    },
    sectionTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginLeft: Spacing.sm,
    },
    sectionSubtext: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      marginBottom: Spacing.sm,
      paddingHorizontal: Spacing.sm,
    },
    descriptionLabel: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
      paddingHorizontal: Spacing.sm,
    },
  });
