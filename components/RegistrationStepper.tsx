import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { Typography, Spacing, lightColors } from '@/constants/theme';
import { apiClient } from '@/services/api';
import Toast from 'react-native-toast-message';
import { MotiView } from 'moti';
import { ChevronLeft, Eye, EyeOff, Search, X } from 'lucide-react-native';
import rwandaLocations from '@/services/location';
import * as SecureStore from 'expo-secure-store';

const getStyles = (colors: any, isDark: boolean) =>
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
    scrollView: {
      flex: 1,
      paddingHorizontal: Spacing.lg,
    },
    stepIndicator: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.xl,
      paddingHorizontal: Spacing.lg,
    },
    step: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: Spacing.xs,
    },
    stepText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
    },
    stepLine: {
      width: 40,
      height: 2,
      backgroundColor: colors.border,
    },
    stepActive: {
      backgroundColor: colors.primary,
    },
    stepCompleted: {
      backgroundColor: colors.success,
    },
    stepInactive: {
      backgroundColor: colors.border,
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
    stepContent: {
      minHeight: 400,
      paddingBottom: Spacing.xl,
    },
    stepTitle: {
      fontSize: Typography.fontSize.xl,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginBottom: Spacing.md,
      textAlign: 'center',
    },
    stepSubtitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      marginBottom: Spacing.xl,
      textAlign: 'center',
    },
    userTypeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing.xl,
    },
    userTypeOption: {
      flex: 1,
      padding: Spacing.lg,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      marginHorizontal: Spacing.xs,
      alignItems: 'center',
    },
    userTypeOptionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    userTypeText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.text,
      textAlign: 'center',
    },
    userTypeTextSelected: {
      color: colors.primary,
      fontFamily: 'DMSans-Bold',
    },
    userTypeDescription: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: Spacing.xs,
    },
    locationSelector: {
      marginBottom: Spacing.md,
    },
    locationSelectorLabel: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    locationSelectorButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      backgroundColor: colors.surface,
    },
    locationSelectorText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.text,
    },
    locationSelectorPlaceholder: {
      color: colors.textSecondary,
    },
    locationModal: {
      flex: 1,
      backgroundColor: colors.background,
    },
    locationModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    locationModalTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
    },
    searchContainer: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    searchInput: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 8,
      paddingHorizontal: Spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchTextInput: {
      flex: 1,
      paddingVertical: Spacing.md,
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.text,
    },
    locationList: {
      flex: 1,
    },
    locationItem: {
      padding: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    locationItemText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.text,
    },
    navigationButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.lg,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    eyeButton: {
      position: 'absolute',
      right: 0,
      top: 30,
      padding: 8,
      borderRadius: 20,
      zIndex: 10,
      backgroundColor: 'transparent',
      minHeight: 0,
      minWidth: 0,
      height: 40,
      width: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

type UserType = 'CLIENT' | 'SELLER';

interface FormData {
  userType: UserType | null;
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
  pin: string;
  confirmPin: string;
}

interface LocationModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: string) => void;
  title: string;
  options: string[];
  searchPlaceholder: string;
}

const LocationModal: React.FC<LocationModalProps> = ({
  visible,
  onClose,
  onSelect,
  title,
  options,
  searchPlaceholder,
}) => {
  const { colors } = useTheme();
  const styles = getStyles(colors, false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);

  React.useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter(option =>
        option.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  }, [searchQuery, options]);

  const handleSelect = (location: string) => {
    onSelect(location);
    onClose();
    setSearchQuery('');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.locationModal}>
        <View style={styles.locationModalHeader}>
          <Text style={styles.locationModalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchInput}>
            <Search size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchTextInput}
              placeholder={searchPlaceholder}
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <FlatList
          style={styles.locationList}
          data={filteredOptions}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.locationItem}
              onPress={() => handleSelect(item)}
            >
              <Text style={styles.locationItemText}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
};

export default function RegistrationStepper() {
  const { theme, colors } = useTheme();
  const isDark = theme === 'dark';
  const styles = getStyles(colors, isDark);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    userType: null,
    firstName: '',
    lastName: '',
    nationalId: '',
    email: '',
    phoneNumber: '',
    province: '',
    district: '',
    sector: '',
    cell: '',
    village: '',
    pin: '',
    confirmPin: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [locationModal, setLocationModal] = useState<{
    visible: boolean;
    type: 'province' | 'district' | 'sector' | 'cell' | 'village';
    title: string;
    options: string[];
    searchPlaceholder: string;
  }>({
    visible: false,
    type: 'province',
    title: '',
    options: [],
    searchPlaceholder: '',
  });

  const steps = [
    { title: 'User Type', subtitle: 'Choose how you want to use the app' },
    { title: 'Personal Info', subtitle: 'Tell us about yourself' },
    { title: 'Location', subtitle: 'Where are you located?' },
    { title: 'Security', subtitle: 'Create your PIN' },
  ];

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleShowPin = useCallback(() => setShowPin((prev) => !prev), []);
  const toggleShowConfirmPin = useCallback(() => setShowConfirmPin((prev) => !prev), []);

  const openLocationModal = (type: 'province' | 'district' | 'sector' | 'cell' | 'village') => {
    let options: string[] = [];
    let title = '';
    let searchPlaceholder = '';

    switch (type) {
      case 'province':
        options = rwandaLocations.getProvinces();
        title = 'Select Province';
        searchPlaceholder = 'Search provinces...';
        break;
      case 'district':
        if (!formData.province) {
          Toast.show({
            type: 'error',
            text1: 'Select Province First',
            text2: 'Please select a province before choosing a district',
          });
          return;
        }
        options = rwandaLocations.getDistricts(formData.province);
        title = 'Select District';
        searchPlaceholder = 'Search districts...';
        break;
      case 'sector':
        if (!formData.province || !formData.district) {
          Toast.show({
            type: 'error',
            text1: 'Select Location First',
            text2: 'Please select province and district before choosing a sector',
          });
          return;
        }
        options = rwandaLocations.getSectors(formData.province, formData.district);
        title = 'Select Sector';
        searchPlaceholder = 'Search sectors...';
        break;
      case 'cell':
        if (!formData.province || !formData.district || !formData.sector) {
          Toast.show({
            type: 'error',
            text1: 'Select Location First',
            text2: 'Please select province, district and sector before choosing a cell',
          });
          return;
        }
        options = rwandaLocations.getCells(formData.province, formData.district, formData.sector);
        title = 'Select Cell';
        searchPlaceholder = 'Search cells...';
        break;
      case 'village':
        if (!formData.province || !formData.district || !formData.sector || !formData.cell) {
          Toast.show({
            type: 'error',
            text1: 'Select Location First',
            text2: 'Please select all location fields before choosing a village',
          });
          return;
        }
        options = rwandaLocations.getVillages(formData.province, formData.district, formData.sector, formData.cell);
        title = 'Select Village';
        searchPlaceholder = 'Search villages...';
        break;
    }

    setLocationModal({
      visible: true,
      type,
      title,
      options,
      searchPlaceholder,
    });
  };

  const handleLocationSelect = (location: string) => {
    updateField(locationModal.type, location);
    
    // Clear dependent fields when parent location changes
    if (locationModal.type === 'province') {
      updateField('district', '');
      updateField('sector', '');
      updateField('cell', '');
      updateField('village', '');
    } else if (locationModal.type === 'district') {
      updateField('sector', '');
      updateField('cell', '');
      updateField('village', '');
    } else if (locationModal.type === 'sector') {
      updateField('cell', '');
      updateField('village', '');
    } else if (locationModal.type === 'cell') {
      updateField('village', '');
    }
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 0:
        if (!formData.userType) {
          Toast.show({
            type: 'error',
            text1: 'Select User Type',
            text2: 'Please choose whether you are a CLIENT or SELLER',
          });
          return false;
        }
        break;
      case 1:
        if (!formData.firstName || !formData.lastName || !formData.nationalId || !formData.phoneNumber) {
          Toast.show({
            type: 'error',
            text1: 'Missing Information',
            text2: 'Please fill in all required fields',
          });
          return false;
        }
        break;
      case 2:
        if (!formData.province || !formData.district || !formData.sector || !formData.cell || !formData.village) {
          Toast.show({
            type: 'error',
            text1: 'Missing Location',
            text2: 'Please select all location fields',
          });
          return false;
        }
        break;
      case 3:
        if (!formData.pin || !formData.confirmPin) {
          Toast.show({
            type: 'error',
            text1: 'Missing PIN',
            text2: 'Please enter and confirm your PIN',
          });
          return false;
        }
        if (formData.pin !== formData.confirmPin) {
          Toast.show({
            type: 'error',
            text1: 'PIN Mismatch',
            text2: 'PINs do not match',
          });
          return false;
        }
        if (formData.pin.length < 4 || formData.pin.length > 20) {
          Toast.show({
            type: 'error',
            text1: 'Invalid PIN',
            text2: 'PIN must be between 4 and 20 characters',
          });
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

  const handleRegister = async () => {
    if (!validateCurrentStep()) return;

    setLoading(true);
    try {
        const { confirmPin, email, ...rest } = formData;
        const registrationData = {
          ...rest,
          ...(email?.trim() ? { email } : {}),
        };
        const response = await apiClient.register(registrationData);

        console.log(response)

      // Store tokens
      if (response.payload?.accessToken) {
        await SecureStore.setItemAsync('access_token', response.payload.accessToken);
      }
      if (response.payload?.refreshToken) {
        await SecureStore.setItemAsync('refresh_token', response.payload.refreshToken);
      }

      // Fetch user profile after successful registration
      try {
        const profileResponse = await apiClient.getProfile();
        if (profileResponse.payload?.user) {
          // Store user data in context or local storage if needed
          console.log('Profile fetched after registration:', profileResponse.payload.user);
        }
      } catch (profileError) {
        console.warn('Failed to fetch profile after registration:', profileError);
        // Continue with registration even if profile fetch fails
      }

      Toast.show({
        type: 'success',
        text1: 'Registration Successful',
        text2: 'Welcome to TrustMe!',
      });

      // Navigate to home page
      router.replace('/(tabs)');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: error.message || 'Something went wrong',
      });
    } finally {
      setLoading(false);
    }
  };

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
            <Text style={styles.stepTitle}>Choose Your User Type</Text>
            <Text style={styles.stepSubtitle}>
              Select how you want to use the TrustMe app
            </Text>

            <View style={styles.userTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.userTypeOption,
                  formData.userType === 'CLIENT' && styles.userTypeOptionSelected,
                ]}
                onPress={() => updateField('userType', 'CLIENT')}
              >
                <Text
                  style={[
                    styles.userTypeText,
                    formData.userType === 'CLIENT' && styles.userTypeTextSelected,
                  ]}
                >
                  CLIENT
                </Text>
                <Text style={styles.userTypeDescription}>
                  Only buy products
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.userTypeOption,
                  formData.userType === 'SELLER' && styles.userTypeOptionSelected,
                ]}
                onPress={() => updateField('userType', 'SELLER')}
              >
                <Text
                  style={[
                    styles.userTypeText,
                    formData.userType === 'SELLER' && styles.userTypeTextSelected,
                  ]}
                >
                  SELLER
                </Text>
                <Text style={styles.userTypeDescription}>
                  Can sell and buy products
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
            <Text style={styles.stepTitle}>Personal Information</Text>
            <Text style={styles.stepSubtitle}>
              Tell us about yourself
            </Text>

            <Input
              label="First Name"
              value={formData.firstName}
              onChangeText={(value) => updateField('firstName', value)}
              required
            />

            <Input
              label="Last Name"
              value={formData.lastName}
              onChangeText={(value) => updateField('lastName', value)}
              required
            />

            <Input
              label="National ID"
              value={formData.nationalId}
              onChangeText={(value) => updateField('nationalId', value)}
              required
            />

            <Input
              label="Email (Optional)"
              value={formData.email}
              onChangeText={(value) => updateField('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Phone Number"
              value={formData.phoneNumber}
              onChangeText={(value) => updateField('phoneNumber', value)}
              keyboardType="phone-pad"
              required
            />
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
            <Text style={styles.stepTitle}>Location Details</Text>
            <Text style={styles.stepSubtitle}>
              Where are you located?
            </Text>

            <View style={styles.locationSelector}>
              <Text style={styles.locationSelectorLabel}>Province *</Text>
              <TouchableOpacity
                style={styles.locationSelectorButton}
                onPress={() => openLocationModal('province')}
              >
                <Text
                  style={[
                    styles.locationSelectorText,
                    !formData.province && styles.locationSelectorPlaceholder,
                  ]}
                >
                  {formData.province || 'Select Province'}
                </Text>
                <ChevronLeft size={20} color={colors.textSecondary} style={{ transform: [{ rotate: '90deg' }] }} />
              </TouchableOpacity>
            </View>

            <View style={styles.locationSelector}>
              <Text style={styles.locationSelectorLabel}>District *</Text>
              <TouchableOpacity
                style={styles.locationSelectorButton}
                onPress={() => openLocationModal('district')}
                disabled={!formData.province}
              >
                <Text
                  style={[
                    styles.locationSelectorText,
                    !formData.district && styles.locationSelectorPlaceholder,
                  ]}
                >
                  {formData.district || 'Select District'}
                </Text>
                <ChevronLeft size={20} color={colors.textSecondary} style={{ transform: [{ rotate: '90deg' }] }} />
              </TouchableOpacity>
            </View>

            <View style={styles.locationSelector}>
              <Text style={styles.locationSelectorLabel}>Sector *</Text>
              <TouchableOpacity
                style={styles.locationSelectorButton}
                onPress={() => openLocationModal('sector')}
                disabled={!formData.district}
              >
                <Text
                  style={[
                    styles.locationSelectorText,
                    !formData.sector && styles.locationSelectorPlaceholder,
                  ]}
                >
                  {formData.sector || 'Select Sector'}
                </Text>
                <ChevronLeft size={20} color={colors.textSecondary} style={{ transform: [{ rotate: '90deg' }] }} />
              </TouchableOpacity>
            </View>

            <View style={styles.locationSelector}>
              <Text style={styles.locationSelectorLabel}>Cell *</Text>
              <TouchableOpacity
                style={styles.locationSelectorButton}
                onPress={() => openLocationModal('cell')}
                disabled={!formData.sector}
              >
                <Text
                  style={[
                    styles.locationSelectorText,
                    !formData.cell && styles.locationSelectorPlaceholder,
                  ]}
                >
                  {formData.cell || 'Select Cell'}
                </Text>
                <ChevronLeft size={20} color={colors.textSecondary} style={{ transform: [{ rotate: '90deg' }] }} />
              </TouchableOpacity>
            </View>

            <View style={styles.locationSelector}>
              <Text style={styles.locationSelectorLabel}>Village *</Text>
              <TouchableOpacity
                style={styles.locationSelectorButton}
                onPress={() => openLocationModal('village')}
                disabled={!formData.cell}
              >
                <Text
                  style={[
                    styles.locationSelectorText,
                    !formData.village && styles.locationSelectorPlaceholder,
                  ]}
                >
                  {formData.village || 'Select Village'}
                </Text>
                <ChevronLeft size={20} color={colors.textSecondary} style={{ transform: [{ rotate: '90deg' }] }} />
              </TouchableOpacity>
            </View>
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
            <Text style={styles.stepTitle}>Create Your PIN</Text>
            <Text style={styles.stepSubtitle}>
              Secure your account with a PIN
            </Text>

            <View>
              <Input
                label="PIN"
                value={formData.pin}
                onChangeText={(value) => updateField('pin', value)}
                secureTextEntry={!showPin}
                keyboardType="number-pad"
                maxLength={20}
                helperText="4-20 characters"
                required
              />
              <TouchableOpacity
                onPress={toggleShowPin}
                style={styles.eyeButton}
                activeOpacity={0.7}
              >
                {showPin ? (
                  <EyeOff size={20} color={lightColors.gray[500]} />
                ) : (
                  <Eye size={20} color={lightColors.gray[500]} />
                )}
              </TouchableOpacity>
            </View>

            <View>
              <Input
                label="Confirm PIN"
                value={formData.confirmPin}
                onChangeText={(value) => updateField('confirmPin', value)}
                secureTextEntry={!showConfirmPin}
                keyboardType="number-pad"
                maxLength={20}
                required
              />
              <TouchableOpacity
                onPress={toggleShowConfirmPin}
                style={[styles.eyeButton, { top: 40 }]}
                activeOpacity={0.7}
              >
                {showConfirmPin ? (
                  <EyeOff size={20} color={lightColors.gray[500]} />
                ) : (
                  <Eye size={20} color={lightColors.gray[500]} />
                )}
              </TouchableOpacity>
            </View>
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
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Create Account</Text>
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
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
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            style={{ flex: currentStep > 0 ? 0.4 : 0.8 }}
          />
        )}
      </View>

      <LocationModal
        visible={locationModal.visible}
        onClose={() => setLocationModal(prev => ({ ...prev, visible: false }))}
        onSelect={handleLocationSelect}
        title={locationModal.title}
        options={locationModal.options}
        searchPlaceholder={locationModal.searchPlaceholder}
      />
    </SafeAreaView>
  );
}
