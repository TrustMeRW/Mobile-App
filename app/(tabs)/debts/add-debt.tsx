import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Trash2, Calendar, User as UserIcon, CalendarDays, Package, FileText, CheckCircle2 } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  Spacing,
  Typography,
  BorderRadius,
} from '@/constants/theme';
import {
  apiClient,
  type User,
  type ApiResponse,
  type PaginatedResponse,
} from '@/services/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MotiView } from 'moti';
import DateTimePicker from '@react-native-community/datetimepicker';

interface DebtItem {
  name: string;
  description: string;
  quantity: number;
  amount: number;
}

interface DebtFormData {
  debtType: 'request' | 'offer';
  items: DebtItem[];
  dueDate: Date;
  selectedUser: User | null;
}

const steps = [
  { title: 'Debt Type', subtitle: 'Choose the type of debt' },
  { title: 'Items & Payment Date', subtitle: 'Add items and choose payment date' },
  { title: 'Select User', subtitle: 'Choose the other party' },
  { title: 'Review & Confirm', subtitle: 'Check details and agree to terms' },
];

export default function AddDebtScreen() {
  const { colors } = useTheme();
  const { user: currentUser } = useAuthContext();
  const styles = getStyles(colors);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<DebtFormData>({
    debtType: 'request',
    items: [{ name: '', description: '', quantity: 1, amount: 0 }],
    dueDate: new Date(),
    selectedUser: null,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Check if user can add debts
  if (currentUser?.userType === 'CLIENT') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft color={colors.text} size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Add New Debt</Text>
        </View>
        <View style={styles.restrictedContainer}>
          <Text style={styles.restrictedTitle}>Access Restricted</Text>
          <Text style={styles.restrictedMessage}>
            CLIENT users cannot create new debts. Only SELLER users can create and manage debts.
          </Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            style={styles.goBackButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Get users with trustability data
  const { data: usersResponse, isLoading: isLoadingUsers } = useQuery<
    ApiResponse<PaginatedResponse<User>>
  >({
    queryKey: ['users-trustability', searchQuery],
    queryFn: async () => {
      if (!searchQuery)
        return {
          message: '',
          payload: { data: [], total: 0, page: 1, limit: 10 },
        };
      const response = await apiClient.getUsersWithCalculatedTrustability({
        search: searchQuery,
        limit: 20,
      });
      // Filter out current user
      response.payload.data = response.payload.data.filter(
        (u: User) => u.id !== currentUser?.id
      );
      return response;
    },
    enabled: searchQuery.length > 0,
  });
  const users = usersResponse?.payload.data || [];

  const createDebtMutation = useMutation({
    mutationFn: (newDebt: DebtFormData) => {
      const { items, dueDate, selectedUser, debtType } = newDebt;
      
      // Format the payment date to YYYY-MM-DD format
      const formattedPaymentDate = dueDate.toISOString().split('T')[0];
      
      if (debtType === 'request') {
        // I owe someone - REQUEST type
        // current user is debtor, selected user is creditor
        return apiClient.requestDebt(
          selectedUser?.id || '',
          items,
          formattedPaymentDate
        );
      } else {
        // Someone owes me - OFFER type
        // current user is creditor, selected user is debtor
        return apiClient.offerDebt(
          selectedUser?.id || '',
          items,
          formattedPaymentDate
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      router.back();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to create debt');
    },
  });

  const updateField = (field: keyof DebtFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', description: '', quantity: 1, amount: 0 }]
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const updateItem = (index: number, field: keyof DebtItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 0:
        if (!formData.debtType) {
          Alert.alert('Error', 'Please select a debt type');
          return false;
        }
        break;
      case 1:
        if (formData.items.some(item => !item.name || item.amount <= 0)) {
          Alert.alert('Error', 'Please fill in all item details and ensure amounts are greater than 0');
          return false;
        }
        if (!formData.dueDate) {
          Alert.alert('Error', 'Please select a due date');
          return false;
        }
        break;
      case 2:
        if (!formData.selectedUser) {
          Alert.alert('Error', 'Please select a user');
          return false;
        }
        break;
      case 3:
        if (!agreedToTerms) {
          Alert.alert('Terms not accepted', 'You must agree to the Terms & Conditions to create the debt.');
          return false;
        }
        break;
    }
    return true;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (!validateCurrentStep()) return;
    createDebtMutation.mutate(formData);
  };

  const onDateChange = (_event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || formData.dueDate;
    setShowDatePicker(Platform.OS === 'ios');
    updateField('dueDate', currentDate);
  };

  const renderUserItem = ({
    item,
  }: {
    item: User;
  }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => {
        updateField('selectedUser', item);
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>
            {item.firstName.charAt(0)}
            {item.lastName.charAt(0)}
          </Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>
            {item.firstName} {item.lastName}
          </Text>
          <View style={styles.trustabilityRow}>
            <Text style={styles.trustabilityText}>
              {item.trustabilityPercentage || 0}% Trustable
            </Text>
            <Text style={styles.paymentRateText}>
              Payment Rate: {item.totalDebts && item.totalDebts > 0 ? Math.round((item.paidDebts || 0) / item.totalDebts * 100) : 0}%
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.viewMoreButton}
          onPress={() => {
            // Navigate to user view page with the user ID
            router.push(`/user/${item.id}`);
          }}
        >
          <Text style={styles.viewMoreButtonText}>View More</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <MotiView
            from={{ opacity: 0, translateX: 50 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'timing', duration: 300 }}
            style={styles.stepContent}
          >
            <Text style={styles.stepTitle}>Choose Debt Type</Text>
            <Text style={styles.stepSubtitle}>
              Select how this debt will be created
            </Text>

            <View style={styles.segmentControl}>
              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  formData.debtType === 'request' && styles.segmentButtonActive,
                ]}
                onPress={() => updateField('debtType', 'request')}
              >
                <Text
                  style={[
                    styles.segmentText,
                    formData.debtType === 'request' && styles.segmentTextActive,
                  ]}
                >
                  I Owe Someone
                </Text>
                <Text style={styles.segmentSubtext}>
                  You are requesting to borrow money/items
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  formData.debtType === 'offer' && styles.segmentButtonActive,
                ]}
                onPress={() => updateField('debtType', 'offer')}
              >
                <Text
                  style={[
                    styles.segmentText,
                    formData.debtType === 'offer' && styles.segmentTextActive,
                  ]}
                >
                  Someone Owes Me
                </Text>
                <Text style={styles.segmentSubtext}>
                  You are offering to lend money/items
                </Text>
              </TouchableOpacity>
            </View>
          </MotiView>
        );

      case 1:
        return (
          <MotiView
            from={{ opacity: 0, translateX: 50 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'timing', duration: 300 }}
            style={styles.stepContent}
          >
            <Text style={styles.stepTitle}>Add Items & Choose Payment Date</Text>
            <Text style={styles.stepSubtitle}>List the items and set when it should be paid</Text>

            {formData.items.map((item, index) => (
              <Card key={index} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemNumber}>Item {index + 1}</Text>
                  {formData.items.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeItem(index)}
                      style={styles.removeItemButton}
                    >
                      <Trash2 color={colors.error} size={20} />
                    </TouchableOpacity>
                  )}
                </View>

            <Input
                  label="Item Name"
                  placeholder="e.g., Rice, Beans, etc."
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

                <View style={styles.itemTotal}>
                  <Text style={styles.itemTotalLabel}>Subtotal:</Text>
                  <Text style={styles.itemTotalAmount}>
                    RWF {(item.quantity * item.amount).toLocaleString()}
                  </Text>
                </View>
              </Card>
            ))}

            <TouchableOpacity
              onPress={addItem}
              style={styles.addItemButton}
            >
              <Plus color={colors.primary} size={20} />
              <Text style={styles.addItemText}>Add Another Item</Text>
            </TouchableOpacity>

            <View style={styles.totalAmount}>
              <Text style={styles.totalAmountLabel}>Total Amount:</Text>
              <Text style={styles.totalAmountValue}>
                RWF {formData.items.reduce((sum, item) => sum + (item.quantity * item.amount), 0).toLocaleString()}
              </Text>
            </View>

            <Text style={[styles.stepTitle, { marginTop: Spacing.md }]}>Payment Date</Text>
            <Text style={styles.stepSubtitle}>When should this debt be paid?</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.datePickerText}>
                {formData.dueDate.toLocaleDateString()}
              </Text>
              <Calendar color={colors.textSecondary} size={20} />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={formData.dueDate}
                mode="date"
                display="default"
                onChange={onDateChange}
              />
            )}
          </MotiView>
        );

      case 2:
        return (
          <MotiView
            from={{ opacity: 0, translateX: 50 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'timing', duration: 300 }}
            style={styles.stepContent}
          >
            <Text style={styles.stepTitle}>Select User</Text>
            <Text style={styles.stepSubtitle}>
              {formData.debtType === 'request' 
                ? 'Who are you borrowing from?' 
                : 'Who are you lending to?'}
            </Text>
            <Text style={styles.stepDescription}>
              {formData.debtType === 'request' 
                ? 'Select the person you want to borrow money/items from' 
                : 'Select the person you want to lend money/items to'}
            </Text>

            <View style={styles.searchContainer}>
            <Input
                placeholder="Search by name, phone number, or national ID..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
            </View>

            {searchQuery.trim().length > 0 && (
              <View style={styles.usersListContainer}>
                <Text style={styles.usersListTitle}>Search Results</Text>
            {isLoadingUsers ? (
                  <View style={styles.loadingContainer}>
                    <LoadingSpinner size={24} />
                  </View>
                ) : users.length > 0 ? (
              <FlatList
                data={users}
                renderItem={renderUserItem}
                keyExtractor={(item) => item.id}
                    style={styles.usersList}
                    showsVerticalScrollIndicator={false}
                  />
                ) : (
                  <View style={styles.emptyResultsContainer}>
                    <Text style={styles.emptyResultsText}>No users found</Text>
                    <Text style={styles.emptyResultsSubtext}>
                      Try searching with a different name or phone number
                    </Text>
                  </View>
                )}
              </View>
            )}

            {formData.selectedUser && (
              <Card style={styles.selectedUserCard}>
                <Text style={styles.selectedUserTitle}>Selected User</Text>
                <View style={styles.selectedUserInfo}>
                  <View style={styles.selectedUserAvatar}>
                    <Text style={styles.selectedUserAvatarText}>
                      {formData.selectedUser.firstName.charAt(0)}
                      {formData.selectedUser.lastName.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.selectedUserDetails}>
                    <Text style={styles.selectedUserName}>
                      {formData.selectedUser.firstName} {formData.selectedUser.lastName}
                    </Text>
                    <Text style={styles.selectedUserPhone}>
                      {formData.selectedUser.phoneNumber}
                    </Text>
                    <Text style={styles.selectedUserLocation}>
                      {formData.selectedUser.village}, {formData.selectedUser.cell}
                    </Text>
                  </View>
                </View>
              </Card>
            )}

            {!searchQuery.trim() && (
              <View style={styles.searchPromptContainer}>
                <Text style={styles.searchPromptText}>
                  Start typing to search for users
                </Text>
                <Text style={styles.searchPromptSubtext}>
                  You can search by name, phone number, or national ID
                </Text>
              </View>
            )}
          </MotiView>
        );

      case 3:
        return (
          <MotiView
            from={{ opacity: 0, translateX: 50 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'timing', duration: 300 }}
            style={styles.stepContent}
          >
            <View style={styles.previewHeader}>
              <CheckCircle2 color={colors.primary} size={32} />
              <Text style={styles.stepTitle}>Review & Confirm</Text>
              <Text style={styles.stepSubtitle}>Please review all details before creating the debt</Text>
            </View>

            <Card style={styles.previewCard}>
              <View style={styles.previewCardHeader}>
                <UserIcon color={colors.primary} size={20} />
                <Text style={styles.previewCardTitle}>Transaction Details</Text>
              </View>
              <View style={styles.previewCardContent}>
                <View style={styles.previewRow}>
                  <View style={styles.previewLabelContainer}>
                    <Text style={styles.previewLabel}>Debt Type</Text>
                  </View>
                  <View style={styles.previewValueContainer}>
                    <Text style={styles.previewValue}>
                      {formData.debtType === 'request' ? 'I Owe Someone' : 'Someone Owes Me'}
                    </Text>
                    <View style={[styles.previewBadge, { backgroundColor: formData.debtType === 'request' ? colors.warning + '20' : colors.success + '20' }]}>
                      <Text style={[styles.previewBadgeText, { color: formData.debtType === 'request' ? colors.warning : colors.success }]}>
                        {formData.debtType === 'request' ? 'REQUEST' : 'OFFER'}
                      </Text>
                    </View>
                    <Text style={styles.previewDescription}>
                      {formData.debtType === 'request' 
                        ? 'You are borrowing from the selected user' 
                        : 'You are lending to the selected user'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.previewRow}>
                  <View style={styles.previewLabelContainer}>
                    <CalendarDays color={colors.textSecondary} size={16} />
                    <Text style={styles.previewLabel}>Payment Date</Text>
                  </View>
                  <View style={styles.previewValueContainer}>
                    <Text style={styles.previewValue}>{formData.dueDate.toLocaleDateString()}</Text>
                  </View>
                </View>
                
                {formData.selectedUser && (
                  <View style={styles.previewRow}>
                    <View style={styles.previewLabelContainer}>
                      <UserIcon color={colors.textSecondary} size={16} />
                      <Text style={styles.previewLabel}>Counterparty</Text>
                    </View>
                    <View style={styles.previewValueContainer}>
                      <View style={styles.previewUserInfo}>
                        <View style={styles.previewUserAvatar}>
                          <Text style={styles.previewUserAvatarText}>
                            {formData.selectedUser.firstName.charAt(0)}{formData.selectedUser.lastName.charAt(0)}
                          </Text>
                        </View>
                        <View style={styles.previewUserDetails}>
                          <Text style={styles.previewUserName}>
                            {formData.selectedUser.firstName} {formData.selectedUser.lastName}
                          </Text>
                          <Text style={styles.previewUserPhone}>{formData.selectedUser.phoneNumber}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </Card>

            <Card style={styles.previewCard}>
              <View style={styles.previewCardHeader}>
                <Package color={colors.primary} size={20} />
                <Text style={styles.previewCardTitle}>Items Summary</Text>
              </View>
              <View style={styles.previewCardContent}>
                {formData.items.map((item, index) => (
                  <View key={index} style={styles.previewItemRow}>
                    <View style={styles.previewItemLeft}>
                      <View style={styles.previewItemNumber}>
                        <Text style={styles.previewItemNumberText}>{index + 1}</Text>
                      </View>
                      <View style={styles.previewItemDetails}>
                        <Text style={styles.previewItemName}>{item.name || 'Unnamed Item'}</Text>
                        {item.description && (
                          <Text style={styles.previewItemDescription}>{item.description}</Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.previewItemRight}>
                      <Text style={styles.previewItemQuantity}>Qty: {item.quantity}</Text>
                      <Text style={styles.previewItemAmount}>RWF {item.amount.toLocaleString()}</Text>
                      <Text style={styles.previewItemSubtotal}>RWF {(item.quantity * item.amount).toLocaleString()}</Text>
                    </View>
                  </View>
                ))}
                
                <View style={styles.previewTotalRow}>
                  <Text style={styles.previewTotalLabel}>Total Amount</Text>
                  <Text style={styles.previewTotalAmount}>
                    RWF {formData.items.reduce((sum, item) => sum + (item.quantity * item.amount), 0).toLocaleString()}
                  </Text>
                </View>
              </View>
            </Card>

            <Card style={styles.previewCard}>
              <View style={styles.previewCardHeader}>
                <FileText color={colors.primary} size={20} />
                <Text style={styles.previewCardTitle}>Terms & Conditions</Text>
              </View>
              <View style={styles.previewCardContent}>
                <View style={styles.termsRow}>
                  <TouchableOpacity 
                    onPress={() => setAgreedToTerms(!agreedToTerms)} 
                    style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}
                  >
                    {agreedToTerms && <CheckCircle2 color={colors.white} size={16} />}
                  </TouchableOpacity>
                  <View style={styles.termsTextContainer}>
                    <Text style={styles.termsText}>
                      I agree to Trust Me{' '}
                      <Text 
                        onPress={() => router.push('/debt-terms')} 
                        style={styles.linkText}
                      >
                        Terms & Conditions
                      </Text>{' '}
                      related to all actions on debts
                    </Text>
                  </View>
                </View>
              </View>
            </Card>
          </MotiView>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Add New Debt</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.stepIndicator}>
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <View
              style={[
                styles.step,
                index === currentStep
                  ? styles.stepActive
                  : index < currentStep
                  ? styles.stepCompleted
                  : styles.stepInactive,
              ]}
            >
              <Text
                style={[
                  styles.stepText,
                  index === currentStep
                    ? styles.stepTextActive
                    : index < currentStep
                    ? styles.stepTextCompleted
                    : styles.stepTextInactive,
                ]}
              >
                {index < currentStep ? '✓' : index + 1}
              </Text>
            </View>
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.stepLine,
                  index < currentStep && { backgroundColor: colors.success },
                ]}
              />
            )}
          </React.Fragment>
        ))}
          </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderStepContent()}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.navigationButtons}>
        {currentStep > 0 && (
          <Button
            title="Previous"
            onPress={prevStep}
            variant="outline"
            style={{ flex: 0.4 }}
          />
        )}
        
        {currentStep < steps.length - 1 ? (
          <Button
            title="Next"
            onPress={nextStep}
            style={{ flex: currentStep > 0 ? 0.4 : 0.8 }}
          />
        ) : (
          <Button
            title="Create Debt"
            onPress={handleSubmit}
            loading={createDebtMutation.isPending}
            disabled={!agreedToTerms}
            style={{ flex: currentStep > 0 ? 0.4 : 0.8 }}
          />
        )}
        </View>
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
    },
    restrictedContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.lg,
    },
    restrictedTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    restrictedMessage: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: Spacing.lg,
    },
    goBackButton: {
      width: '100%',
    },
    stepIndicator: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: Spacing.md,
      paddingHorizontal: Spacing.md,
    },
    step: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.card,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    stepActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    stepCompleted: {
      backgroundColor: colors.success,
      borderColor: colors.success,
    },
    stepInactive: {
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
    stepText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Bold',
      color: colors.textSecondary,
    },
    stepTextActive: {
      color: colors.white,
    },
    stepTextCompleted: {
      color: colors.white,
    },
    stepTextInactive: {
      color: colors.textSecondary,
    },
    stepLine: {
      width: 1,
      height: 20,
      backgroundColor: colors.border,
      position: 'absolute',
      top: 20,
      left: 20,
    },
    content: {
      flexGrow: 1,
      padding: Spacing.lg,
    },
    stepContent: {
      marginBottom: Spacing.lg,
    },
    stepTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    stepSubtitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      marginBottom: Spacing.lg,
    },
    segmentControl: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.lg,
      borderWidth: 1,
      borderColor: colors.primary,
      overflow: 'hidden',
    },
    segmentButton: {
      flex: 1,
      padding: Spacing.md,
      alignItems: 'center',
    },
    segmentButtonActive: {
      backgroundColor: colors.primary,
    },
    segmentText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Bold',
      color: colors.primary,
    },
    segmentTextActive: {
      color: colors.white,
    },
    segmentSubtext: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      marginTop: Spacing.xs,
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
    removeItemButton: {
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
    itemTotal: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    itemTotalLabel: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.textSecondary,
    },
    itemTotalAmount: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Bold',
      color: colors.primary,
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
    totalAmount: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    totalAmountLabel: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.textSecondary,
    },
    totalAmountValue: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Bold',
      color: colors.primary,
    },
    datePickerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    datePickerText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.text,
    },
    userSelectorButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    userSelectorText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.text,
    },
    navigationButtons: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      padding: Spacing.md,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: Spacing.lg,
      height: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    modalTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
    },
    closeButton: {
      padding: Spacing.sm,
    },
    searchInput: {
      marginBottom: Spacing.md,
    },
    userItem: {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    userAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    userAvatarText: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-Bold',
      color: colors.primary,
    },
    userDetails: {
      flex: 1,
    },
    userName: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.text,
    },
    trustabilityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: Spacing.xs,
    },
    trustabilityText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      marginRight: Spacing.sm,
    },
    paymentRateText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
    },
         selectedUserCard: {
       marginTop: Spacing.md,
       borderRadius: BorderRadius.md,
       overflow: 'hidden',
     },
     selectedUserTitle: {
       fontSize: Typography.fontSize.md,
       fontFamily: 'DMSans-Bold',
       color: colors.text,
       padding: Spacing.md,
       borderBottomWidth: 1,
       borderBottomColor: colors.border,
     },
    selectedUserInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
    },
    selectedUserAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    selectedUserAvatarText: {
      fontSize: Typography.fontSize.xl,
      fontFamily: 'DMSans-Bold',
      color: colors.primary,
    },
    selectedUserDetails: {
      flex: 1,
    },
    selectedUserName: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.text,
    },
    selectedUserPhone: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      marginTop: Spacing.xs,
    },
    selectedUserLocation: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      marginTop: Spacing.xs,
    },
    searchContainer: {
      marginBottom: Spacing.md,
    },
    usersListContainer: {
      marginTop: Spacing.md,
    },
    usersListTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    loadingContainer: {
      paddingVertical: Spacing.md,
    },
    usersList: {
      maxHeight: 200, // Limit height for scrolling
    },
    emptyResultsContainer: {
      alignItems: 'center',
      paddingVertical: Spacing.md,
    },
    emptyResultsText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    emptyResultsSubtext: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
    },
    searchPromptContainer: {
      alignItems: 'center',
      paddingVertical: Spacing.md,
    },
    searchPromptText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    searchPromptSubtext: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
    },
    emptyListText: {
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: Spacing.lg,
      alignItems: 'center',
      marginLeft: Spacing.md,
    },
    selectedIndicator: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: colors.primary,
    },
    
    // Preview styles
    previewHeader: {
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    previewCard: {
      marginBottom: Spacing.lg,
      borderRadius: BorderRadius.lg,
      overflow: 'hidden',
      elevation: 2,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    previewCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      backgroundColor: colors.primaryLight,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    previewCardTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginLeft: Spacing.sm,
    },
    previewCardContent: {
      padding: Spacing.md,
    },
    previewRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '30',
    },
    previewLabelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    previewLabel: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.textSecondary,
      marginLeft: Spacing.sm,
    },
    previewValueContainer: {
      flex: 1,
      alignItems: 'flex-end',
    },
    previewValue: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.text,
      textAlign: 'right',
    },
    previewBadge: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.sm,
      marginTop: Spacing.xs,
    },
    previewBadgeText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Bold',
      textTransform: 'uppercase',
    },
    previewDescription: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      marginTop: Spacing.xs,
    },
    previewUserInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    previewUserAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.sm,
    },
    previewUserAvatarText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Bold',
      color: colors.primary,
    },
    previewUserName: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.text,
    },
    previewUserPhone: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      marginTop: 2,
    },
    previewItemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '30',
    },
    previewItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    previewItemNumber: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.sm,
    },
    previewItemNumberText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Bold',
      color: colors.primary,
    },
    previewItemDetails: {
      flex: 1,
    },
    previewItemName: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.text,
      marginBottom: 2,
    },
    previewItemDescription: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
    },
    previewItemRight: {
      alignItems: 'flex-end',
    },
    previewItemQuantity: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      marginBottom: 2,
    },
    previewItemAmount: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      marginBottom: 2,
    },
    previewItemSubtotal: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Bold',
      color: colors.primary,
    },
    previewTotalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: Spacing.md,
      marginTop: Spacing.sm,
      borderTopWidth: 2,
      borderTopColor: colors.primary + '30',
    },
    previewTotalLabel: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
    },
    previewTotalAmount: {
      fontSize: Typography.fontSize.xl,
      fontFamily: 'DMSans-Bold',
      color: colors.primary,
    },
    termsRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: BorderRadius.sm,
      borderWidth: 2,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.sm,
      marginTop: 2,
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    termsTextContainer: {
      flex: 1,
    },
    termsText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      lineHeight: 22,
    },
    linkText: {
      color: colors.primary,
      fontFamily: 'DMSans-Bold',
      textDecorationLine: 'underline',
    },
    previewUserDetails: {
      flex: 1,
    },
    viewMoreButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.sm,
      marginLeft: Spacing.sm,
    },
    viewMoreButtonText: {
      color: colors.white,
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
    },
    stepDescription: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      marginTop: Spacing.xs,
      marginBottom: Spacing.lg,
    },
  });
