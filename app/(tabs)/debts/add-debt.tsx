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
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { apiClient } from '@/services/api';
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
  Trash2,
  QrCode,
  User,
  Calendar,
  Package,
  DollarSign,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
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
  const { user } = useAuthContext();
  const router = useRouter();
  const queryClient = useQueryClient();
  const styles = getStyles(colors);

  const [currentStep, setCurrentStep] = useState(0);
  const [showScanner, setShowScanner] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [scannedUserData, setScannedUserData] = useState<UserTrustabilityData | null>(null);
  const [manualUserCode, setManualUserCode] = useState('');
  const [debtForm, setDebtForm] = useState<DebtFormData>({
    items: [{ name: '', description: '', quantity: 1, amount: 0 }],
    dueDate: null,
    selectedUser: null,
    intiationType: 'REQUEST',
  });

  // Safety check for user
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.errorText}>User not authenticated</Text>
        </View>
      </SafeAreaView>
    );
  }

  const createDebtMutation = useMutation({
    mutationFn: (newDebt: DebtFormData) => {
      const { items, dueDate, selectedUser, intiationType } = newDebt;
      
      if (intiationType === 'REQUEST') {
        return apiClient.requestDebt(
          selectedUser?.id || '',
          items,
          dueDate ? dueDate.toISOString().split('T')[0] : undefined
        );
      } else {
        return apiClient.offerDebt(
          selectedUser?.id || '',
          items,
          dueDate ? dueDate.toISOString().split('T')[0] : undefined
        );
      }
    },
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Debt created successfully!',
      });
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      router.back();
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to create debt',
      });
    },
  });

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
    try {
      const response = await apiClient.getUserTrustabilityAnalyticsByCode(code);
      setScannedUserData(response.payload);
      setShowScanner(false);
      setCurrentStep(2); // Move to user display step
    } catch (error: any) {
      console.error('QR Code scan error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to fetch user data. Please try again.',
        [
          { text: 'OK', onPress: () => setShowScanner(false) },
        ]
      );
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
    setCurrentStep(0); // Go back to step 1
  };

  const handleManualCodeSubmit = async () => {
    if (!manualUserCode.trim()) {
      Alert.alert('Error', 'Please enter a valid user code.');
      return;
    }

    try {
      const response = await apiClient.getUserTrustabilityAnalyticsByCode(manualUserCode.trim());
      setScannedUserData(response.payload);
      setManualUserCode('');
      setCurrentStep(2); // Move to user display step
    } catch (error: any) {
      console.error('Manual code scan error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to fetch user data. Please try again.',
        [
          { text: 'OK' },
        ]
      );
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
        Alert.alert(
          'Invalid Date',
          'Please select a date from tomorrow onwards.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleSubmit = () => {
    if (!debtForm.selectedUser) {
      Alert.alert('Error', 'Please select a user first');
      return;
    }

    const hasEmptyFields = debtForm.items.some(
      item => !item.name || !item.description || item.amount <= 0
    );

    if (hasEmptyFields) {
      Alert.alert('Error', 'Please fill in all item details');
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
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600 }}
          >
            <Card style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <Package color={colors.primary} size={24} />
                <Text style={styles.stepTitle}>Select Debt Type</Text>
              </View>
              <Text style={styles.stepSubtext}>
                Choose how you want to proceed with the debt
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
                      I Owe Someone
                    </Text>
                    <Text style={[
                      styles.debtTypeSubtext,
                      debtForm.intiationType === 'REQUEST' && styles.debtTypeSubtextActive
                    ]}>
                      You're requesting to borrow from someone
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
                      Someone Owes Me
                    </Text>
                    <Text style={[
                      styles.debtTypeSubtext,
                      debtForm.intiationType === 'offer' && styles.debtTypeSubtextActive
                    ]}>
                      You're offering to lend to someone
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </Card>
          </MotiView>
        );

      case 1:
        return (
          <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600 }}
          >
            <Card style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <Package color={colors.primary} size={24} />
                <Text style={styles.stepTitle}>Add Items & Set Date</Text>
              </View>
              <Text style={styles.stepSubtext}>
                Add the items you want to include in this debt and set a payment due date
              </Text>

              {debtForm.items.map((item, index) => (
                <View key={index} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemNumber}>Item {index + 1}</Text>
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
                    label="Item Name"
                    placeholder="Enter item name"
                    value={item.name}
                    onChangeText={(value) => updateItem(index, 'name', value)}
                    style={styles.itemInput}
                  />

                  <Input
                    label="Description"
                    placeholder="Brief description of the item"
                    value={item.description}
                    onChangeText={(value) => updateItem(index, 'description', value)}
                    style={styles.itemInput}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />

                  <View style={styles.itemRow}>
                    <Input
                      label="Quantity"
                      placeholder="1"
                      value={item.quantity.toString()}
                      onChangeText={(value) => updateItem(index, 'quantity', parseInt(value) || 1)}
                      keyboardType="numeric"
                      style={[styles.itemInput, { flex: 0.48 }]}
                    />
                    <Input
                      label="Amount (RWF)"
                      placeholder="0"
                      value={item.amount.toString()}
                      onChangeText={(value) => updateItem(index, 'amount', parseFloat(value) || 0)}
                      keyboardType="numeric"
                      style={[styles.itemInput, { flex: 0.48 }]}
                    />
                  </View>
                </View>
              ))}

              <TouchableOpacity style={styles.addItemButton} onPress={addItem}>
                <Plus color={colors.primary} size={20} />
                <Text style={styles.addItemText}>Add Another Item</Text>
              </TouchableOpacity>

              {/* Payment Date Section */}
              <View style={styles.paymentDateSection}>
                <View style={styles.sectionHeader}>
                  <Calendar color={colors.primary} size={20} />
                  <Text style={styles.sectionTitle}>Payment Date (Optional)</Text>
                </View>
                <Text style={styles.sectionSubtext}>
                  Set a payment due date for this debt. If not specified, no due date will be set.
                </Text>
                
                <View style={styles.datePickerContainer}>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Calendar color={colors.primary} size={18} />
                    <Text style={styles.datePickerButtonText}>
                      {debtForm.dueDate ? debtForm.dueDate.toLocaleDateString() : 'Select Date'}
                    </Text>
                  </TouchableOpacity>
                  
                  {debtForm.dueDate && (
                    <View style={styles.dateActionsContainer}>
                      <TouchableOpacity
                        style={styles.clearDateButton}
                        onPress={() => setDebtForm(prev => ({ ...prev, dueDate: null }))}
                      >
                        <Text style={styles.clearDateButtonText}>Clear Date</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                
                {debtForm.dueDate && (
                  <View style={styles.dateInfo}>
                    <Text style={styles.dateInfoText}>
                      Payment due: {debtForm.dueDate.toLocaleDateString()}
                    </Text>
                    <Text style={styles.dateInfoSubtext}>
                      This debt will be marked as overdue after this date
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
              </View>
            </Card>
          </MotiView>
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
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 300 }}
          >
            <Card style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <QrCode color={colors.primary} size={24} />
                <Text style={styles.stepTitle}>Scan User QR Code</Text>
              </View>
              <Text style={styles.stepSubtext}>
                {debtForm.intiationType === 'REQUEST'
                  ? 'Scan the QR code of the person you want to borrow from'
                  : 'Scan the QR code of the person you want to lend to'
                }
              </Text>
              <TouchableOpacity
                style={styles.scanButton}
                onPress={() => setShowScanner(true)}
              >
                <QrCode color={colors.white} size={24} />
                <Text style={styles.scanButtonText}>Scan QR Code</Text>
              </TouchableOpacity>
              
              {/* Manual Input Section */}
              <View style={styles.manualInputSection}>
                <Text style={styles.manualInputLabel}>Or enter user code manually:</Text>
                <View style={styles.manualInputContainer}>
                  <Input
                    placeholder="Enter user code"
                    value={manualUserCode}
                    onChangeText={setManualUserCode}
                    style={styles.manualInput}
                  />
                  <TouchableOpacity
                    style={styles.manualSubmitButton}
                    onPress={handleManualCodeSubmit}
                    disabled={!manualUserCode.trim()}
                  >
                    <Text style={styles.manualSubmitButtonText}>Fetch User</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <Text style={styles.scanInstructions}>
                Point your camera at the user's QR code to scan and view their trustability analytics
              </Text>
            </Card>

            {/* Payment Date Section - Separate Card */}
            {/* This section is now moved to step 1 */}
          </MotiView>
        );

      case 3:
        return (
          <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600 }}
          >
            <Card style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <User color={colors.primary} size={24} />
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
          </MotiView>
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
        return 'Add Items & Set Date';
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
        return debtForm.items.every(item => item.name && item.description && item.amount > 0);
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
          <LoadingSpinner size={48} />
          <Text style={styles.loadingText}>Creating debt...</Text>
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
        <Text style={styles.title}>Add New Debt</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Step Indicator */}
      <View style={styles.stepIndicator}>
        {[0, 1, 2, 3].map((step) => (
          <View key={step} style={styles.stepDotContainer}>
            <View
              style={[
                styles.stepDot,
                step <= currentStep && styles.stepDotActive,
              ]}
            />
            {step < 3 && (
              <View
                style={[
                  styles.stepLine,
                  step < currentStep && styles.stepLineActive,
                ]}
              />
            )}
          </View>
        ))}
      </View>

      {/* Step Title */}
      <Text style={styles.stepTitleText}>{getStepTitle()}</Text>
      
      {/* Step Description */}
      {currentStep === 1 && (
        <Text style={styles.stepDescription}>
          Add debt items and optionally set a payment due date
        </Text>
      )}
      {currentStep === 2 && (
        <Text style={styles.stepDescription}>
          Scan a user's QR code to select who you're creating the debt with
        </Text>
      )}

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        {canGoBack() && (
          <Button
            title="Previous"
            onPress={handlePrevious}
            variant="outline"
            style={styles.navButton}
          />
        )}
        {currentStep < 3 ? (
          <Button
            title="Next"
            onPress={handleNext}
            disabled={!canProceed()}
            style={styles.navButton}
          />
        ) : (
          <Button
            title="Create Debt"
            onPress={handleSubmit}
            disabled={!canProceed()}
            style={styles.navButton}
          />
        )}
      </View>

      {/* QR Code Scanner */}
      {showScanner && (
        <QRCodeScanner
          isVisible={showScanner}
          onScan={handleQRCodeScan}
          onClose={() => setShowScanner(false)}
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
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.sm,
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
      paddingHorizontal: Spacing.lg,
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
      borderRadius: BorderRadius.md,
      overflow: 'hidden',
      padding: Spacing.md,
    },
    stepHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
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
      padding: Spacing.sm,
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
    itemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.sm,
      marginBottom: Spacing.sm,
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
      justifyContent: 'space-around',
      padding: Spacing.md,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    navButton: {
      flex: 1,
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
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
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
      borderLeftWidth: 1,
      borderLeftColor: colors.border,
    },
    manualSubmitButtonText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.white,
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
  });
