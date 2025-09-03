import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/contexts/TranslationContext';
import { useToast } from '@/contexts/ToastContext';
import { useCreateEmployment, useFetchEmploymentAnalytics } from '@/hooks';
import { CreateEmploymentDto, EmploymentReport } from '@/types/api';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { MotiView } from 'moti';
import {
  ChevronLeft,
  ChevronRight,
  Briefcase,
  User as UserIcon,
  Calendar,
  DollarSign,
  QrCode,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
} from 'lucide-react-native';
import QRCodeScanner from '@/components/QRCodeScanner';
import UserTrustabilityDisplay from '@/components/UserTrustabilityDisplay';

interface EmploymentFormData {
  title: string;
  description: string;
  salary: string;
  paymentType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM_RANGE' | 'AFTER_JOB';
  startDate: Date | null;
  selectedEmployee: {
    id: string;
    fullName: string;
    code: string;
  } | null;
}

interface EmployeeAnalyticsData {
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
    isTrustable: boolean;
    status: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  employments: any[];
  reports: any[];
  analytics: {
    totalEmployments: number;
    activeEmployments: number;
    totalReports: number;
    approvedReports: number;
    pendingReports: number;
    rejectedReports: number;
    totalHoursWorked: number;
    averageHoursPerReport: number;
  };
}

export default function CreateEmploymentScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();
  const router = useRouter();
  const styles = getStyles(colors);

  const [currentStep, setCurrentStep] = useState(0);
  const [currentSubStep, setCurrentSubStep] = useState(0);
  const [showScanner, setShowScanner] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [scannedEmployeeData, setScannedEmployeeData] = useState<EmployeeAnalyticsData | null>(null);
  const [manualEmployeeCode, setManualEmployeeCode] = useState('');
  const [isPendingRequest, setIsPendingRequest] = useState(false);
  const [employmentForm, setEmploymentForm] = useState<EmploymentFormData>({
    title: '',
    description: '',
    salary: '',
    paymentType: 'MONTHLY',
    startDate: null,
    selectedEmployee: null,
  });
  const [termsAccepted, setTermsAccepted] = useState(false);

  const createEmploymentMutation = useCreateEmployment();
  const { mutateAsync: fetchEmployeeAnalytics } = useFetchEmploymentAnalytics();

  // Handle successful employment creation
  useEffect(() => {
    if (createEmploymentMutation.isSuccess) {
      showSuccess('Success', 'Employment offer created successfully!');
      router.back();
    }
  }, [createEmploymentMutation.isSuccess, router, showSuccess]);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      if (currentStep === 1) {
        // If going back from job details, go to sub-step 1 of step 0
        setCurrentStep(0);
        setCurrentSubStep(1);
      } else {
        setCurrentStep(currentStep - 1);
      }
    }
  };

  const handleQRCodeScan = async (code: string) => {
    if (isPendingRequest) {
      showError(
        'Request in Progress',
        'Please wait for the current request to complete before scanning another QR code.'
      );
      return;
    }

    try {
      setIsPendingRequest(true);
      const response = await fetchEmployeeAnalytics(code);
      setScannedEmployeeData(response.payload);
      setShowScanner(false);
      setCurrentSubStep(1); // Move to employee profile sub-step
    } catch (error: any) {
      console.error('QR Code scan error:', error);
      showError(
        'QR Code Scan Failed',
        error.response?.data?.message || error.message || 'Failed to fetch employee data. Please try again.'
      );
      setShowScanner(false);
    } finally {
      setIsPendingRequest(false);
    }
  };

  const handleProceed = () => {
    if (scannedEmployeeData) {
      setEmploymentForm(prev => ({
        ...prev,
        selectedEmployee: {
          id: scannedEmployeeData.user.id,
          fullName: `${scannedEmployeeData.user.firstName} ${scannedEmployeeData.user.lastName}`,
          code: scannedEmployeeData.user.code,
        },
      }));
      setCurrentStep(1); // Move to job details step
    }
  };

  const handleCancel = () => {
    setScannedEmployeeData(null);
    setManualEmployeeCode('');
    setIsPendingRequest(false);
    setCurrentSubStep(0); // Go back to sub-step 0
  };

  const handleManualCodeSubmit = async () => {
    if (!manualEmployeeCode.trim()) {
      showError('Invalid Code', 'Please enter a valid employee code.');
      return;
    }

    if (isPendingRequest) {
      showError(
        'Request in Progress',
        'Please wait for the current request to complete before submitting another code.'
      );
      return;
    }

    try {
      setIsPendingRequest(true);
      const response = await fetchEmployeeAnalytics(manualEmployeeCode.trim());
      setScannedEmployeeData(response.payload);
      setManualEmployeeCode('');
      setCurrentSubStep(1); // Move to employee profile sub-step
    } catch (error: any) {
      console.error('Manual code scan error:', error);
      showError(
        'Code Submission Failed',
        error.response?.data?.message || error.message || 'Failed to fetch employee data. Please try again.'
      );
    } finally {
      setIsPendingRequest(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    
    if (selectedDate) {
      // Ensure the selected date is from today onwards
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate >= today) {
        setEmploymentForm(prev => ({ ...prev, startDate: selectedDate }));
      } else {
        showError(
          'Invalid Date',
          'Please select a date from today onwards.'
        );
      }
    }
  };

  const handleSubmit = () => {
    if (!employmentForm.selectedEmployee) {
      showError('Error', 'Please select an employee first');
      return;
    }

    if (!employmentForm.title.trim()) {
      showError('Error', 'Please enter a job title');
      return;
    }

    const createData: CreateEmploymentDto = {
      employeeId: employmentForm.selectedEmployee.id,
      title: employmentForm.title.trim(),
      description: employmentForm.description.trim() || undefined,
      salary: employmentForm.salary ? parseFloat(employmentForm.salary) : undefined,
      paymentType: employmentForm.paymentType,
      startDate: employmentForm.startDate?.toISOString(),
    };

    createEmploymentMutation.mutate(createData, {
      onError: (error: any) => {
        showError('Employment not created', error.response?.data?.message || error.message || 'Failed to create employment');
      }
    });
  };

  const resetForm = () => {
    setEmploymentForm({
      title: '',
      description: '',
      salary: '',
      paymentType: 'MONTHLY',
      startDate: null,
      selectedEmployee: null,
    });
    setTermsAccepted(false);
    setCurrentStep(0);
    setCurrentSubStep(0);
    setScannedEmployeeData(null);
    setManualEmployeeCode('');
    setShowDatePicker(false);
    setIsPendingRequest(false);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        if (currentSubStep === 0) {
          // Sub-step 0: QR scan and manual input
          return (
            <Card style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <QrCode color={colors.primary} size={24} />
                <Text style={styles.stepTitle}>Scan Employee QR Code</Text>
              </View>
              <Text style={styles.stepSubtext}>
                Scan the QR code of the employee you want to hire
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
                  {isPendingRequest ? 'Scanning...' : 'Scan QR Code'}
                </Text>
              </TouchableOpacity>
              
              <View style={styles.manualInputSection}>
                <Text style={styles.manualInputLabel}>Or enter employee code manually</Text>
                <View style={styles.manualInputContainer}>
                  <Input
                    placeholder="Enter employee code"
                    value={manualEmployeeCode}
                    onChangeText={(text) => setManualEmployeeCode(text.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    style={styles.manualInput}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    keyboardType="default"
                  />
                  <TouchableOpacity
                    style={[
                      styles.manualSubmitButton,
                      isPendingRequest && styles.manualSubmitButtonDisabled
                    ]}
                    onPress={handleManualCodeSubmit}
                    disabled={!manualEmployeeCode.trim() || isPendingRequest}
                    activeOpacity={0.8}
                  >
                    <Search color={colors.white} size={20} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          );
        } else {
          // Sub-step 1: Employee profile
          if (scannedEmployeeData) {
            return (
              <View>
                <Card style={styles.stepCard}>
                  <View style={styles.stepHeader}>
                    <UserIcon color={colors.primary} size={24} />
                    <Text style={styles.stepTitle}>Employee Profile</Text>
                  </View>
                  <Text style={styles.stepSubtext}>
                    Review the employee's employment history and reliability
                  </Text>
                </Card>
                
                {/* Enhanced Employee Profile Display */}
                <Card style={styles.employeeCard}>
                  <View style={styles.employeeHeader}>
                    <View style={styles.employeeAvatar}>
                      <UserIcon color={colors.primary} size={28} />
                    </View>
                    <View style={styles.employeeInfo}>
                      <Text style={styles.employeeName}>
                        {`${scannedEmployeeData.user.firstName} ${scannedEmployeeData.user.lastName}`}
                      </Text>
                      <Text style={styles.employeeCode}>Employee Code: {scannedEmployeeData.user.code}</Text>
                      <View style={styles.employeeStatusContainer}>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: scannedEmployeeData.user.isActive ? colors.success + '20' : colors.error + '20' }
                        ]}>
                          <Text style={[
                            styles.statusText,
                            { color: scannedEmployeeData.user.isActive ? colors.success : colors.error }
                          ]}>
                            {scannedEmployeeData.user.isActive ? 'Active' : 'Inactive'}
                          </Text>
                        </View>
                        <View style={[
                          styles.trustabilityBadge,
                          { backgroundColor: scannedEmployeeData.user.isTrustable ? colors.success + '20' : colors.warning + '20' }
                        ]}>
                          <Text style={[
                            styles.trustabilityText,
                            { color: scannedEmployeeData.user.isTrustable ? colors.success : colors.warning }
                          ]}>
                            {scannedEmployeeData.user.isTrustable ? 'Trustable' : 'Not Trustable'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Professional Statistics Grid */}
                  <View style={styles.employeeStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{scannedEmployeeData.analytics.totalEmployments}</Text>
                      <Text style={styles.statLabel}>Total Jobs</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{scannedEmployeeData.analytics.activeEmployments}</Text>
                      <Text style={styles.statLabel}>Active Jobs</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{scannedEmployeeData.analytics.approvedReports}</Text>
                      <Text style={styles.statLabel}>Approved</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{scannedEmployeeData.analytics.totalHoursWorked}</Text>
                      <Text style={styles.statLabel}>Hours Worked</Text>
                    </View>
                  </View>

                  {/* Location Information */}
                  <View style={styles.locationSection}>
                    <Text style={styles.locationTitle}>Location</Text>
                    <View style={styles.locationDetails}>
                      <Text style={styles.locationText}>
                        {scannedEmployeeData.user.province}, {scannedEmployeeData.user.district}
                      </Text>
                      <Text style={styles.locationSubtext}>
                        {scannedEmployeeData.user.sector}, {scannedEmployeeData.user.cell}
                      </Text>
                    </View>
                  </View>

                  {/* Contact Information */}
                  <View style={styles.contactSection}>
                    <Text style={styles.contactTitle}>Contact Information</Text>
                    <View style={styles.contactDetails}>
                      <Text style={styles.contactText}>Phone: {scannedEmployeeData.user.phoneNumber}</Text>
                      <Text style={styles.contactText}>Email: {scannedEmployeeData.user.email}</Text>
                    </View>
                  </View>

                  {/* Professional Summary */}
                  <View style={styles.summarySection}>
                    <Text style={styles.summaryTitle}>Professional Summary</Text>
                    <Text style={styles.summaryText}>
                      This employee has completed {scannedEmployeeData.analytics.totalEmployments} jobs with 
                      {scannedEmployeeData.analytics.activeEmployments} currently active. They have worked a total of 
                      {scannedEmployeeData.analytics.totalHoursWorked} hours and have {scannedEmployeeData.analytics.approvedReports} 
                      approved reports, indicating a {scannedEmployeeData.user.isTrustable ? 'reliable' : 'questionable'} work history.
                    </Text>
                  </View>
                </Card>
              </View>
            );
          }
        }
        return null;

      case 1:
        return (
          <Card style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <Briefcase color={colors.primary} size={24} />
              <Text style={styles.stepTitle}>Job Details</Text>
            </View>
            <Text style={styles.stepSubtext}>
              Enter the basic information about the employment position
            </Text>

            <Input
              label="Job Title *"
              placeholder="e.g., Software Developer, Marketing Manager"
              value={employmentForm.title}
              onChangeText={(value) => setEmploymentForm(prev => ({ ...prev, title: value }))}
              style={styles.input}
            />

            <Text style={styles.descriptionLabel}>Job Description</Text>
            <TextInput
              placeholder="Describe the role, responsibilities, and requirements..."
              value={employmentForm.description}
              onChangeText={(value) => setEmploymentForm(prev => ({ ...prev, description: value }))}
              style={styles.descriptionInput}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor={colors.textSecondary}
            />

            <Input
              label="Salary (RWF)"
              placeholder="e.g., 500000"
              value={employmentForm.salary}
              onChangeText={(value) => setEmploymentForm(prev => ({ ...prev, salary: value }))}
              keyboardType="numeric"
              style={styles.input}
            />

            <Text style={styles.paymentTypeLabel}>Payment Type *</Text>
            <View style={styles.paymentTypeOptions}>
              {[{ key: 'HOURLY', label: 'Hourly' },
                { key: 'DAILY', label: 'Daily' },
                { key: 'WEEKLY', label: 'Weekly' },
                { key: 'MONTHLY', label: 'Monthly' },
                { key: 'CUSTOM_RANGE', label: 'Custom Range' },
                { key: 'AFTER_JOB', label: 'After Job' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.paymentTypeOption,
                    employmentForm.paymentType === option.key && styles.paymentTypeOptionActive
                  ]}
                  onPress={() => setEmploymentForm(prev => ({ ...prev, paymentType: option.key as any }))}
                >
                  <Text style={[
                    styles.paymentTypeText,
                    employmentForm.paymentType === option.key && styles.paymentTypeTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.datePickerContainer}>
              <Text style={styles.dateLabel}>Start Date (Optional)</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar color={colors.primary} size={18} />
                <Text style={styles.datePickerButtonText}>
                  {employmentForm.startDate ? employmentForm.startDate.toLocaleDateString() : 'Select start date'}
                </Text>
              </TouchableOpacity>
              
              {employmentForm.startDate && (
                <TouchableOpacity
                  style={styles.clearDateButton}
                  onPress={() => setEmploymentForm(prev => ({ ...prev, startDate: null }))}
                >
                  <Text style={styles.clearDateButtonText}>Clear Date</Text>
                </TouchableOpacity>
              )}
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={employmentForm.startDate || new Date()}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}
          </Card>
        );

      case 2:
        return (
          <Card style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <FileText color={colors.primary} size={24} />
              <Text style={styles.stepTitle}>Terms & Conditions</Text>
            </View>
            <Text style={styles.stepSubtext}>
              Please read and accept the terms and conditions for creating this employment offer
            </Text>

            <ScrollView style={styles.termsContainer} showsVerticalScrollIndicator={false}>
              <Text style={styles.termsTitle}>Employment Creation Terms & Conditions</Text>
              
              <Text style={styles.termsSectionTitle}>1. Employment Agreement</Text>
              <Text style={styles.termsText}>
                By creating this employment offer, you agree to hire the selected employee under the specified terms. 
                This creates a legally binding employment agreement between both parties.
              </Text>

              <Text style={styles.termsSectionTitle}>2. Job Responsibilities</Text>
              <Text style={styles.termsText}>
                The employee agrees to perform the duties and responsibilities as outlined in the job description. 
                Both parties must adhere to the agreed-upon work schedule and performance standards.
              </Text>

              <Text style={styles.termsSectionTitle}>3. Payment Terms</Text>
              <Text style={styles.termsText}>
                Payment will be made according to the specified schedule and amount. 
                Any changes to payment terms must be agreed upon by both parties in writing.
              </Text>

              <Text style={styles.termsSectionTitle}>4. TrustME Platform</Text>
              <Text style={styles.termsText}>
                TrustME acts as a platform to facilitate employment creation and tracking. 
                We are not responsible for employment disputes or payment issues between parties.
              </Text>

              <Text style={styles.termsSectionTitle}>5. Workplace Safety</Text>
              <Text style={styles.termsText}>
                Both employer and employee must comply with workplace safety regulations and standards. 
                Any safety concerns should be reported immediately.
              </Text>

              <Text style={styles.termsSectionTitle}>6. Termination</Text>
              <Text style={styles.termsText}>
                Either party may terminate the employment with appropriate notice as per local labor laws. 
                TrustME may assist with termination procedures but is not responsible for final decisions.
              </Text>

              <Text style={styles.termsSectionTitle}>7. Data Privacy</Text>
              <Text style={styles.termsText}>
                Personal and employment information will be handled according to our privacy policy. 
                Employment data may be shared with relevant parties for verification purposes.
              </Text>

              <Text style={styles.termsSectionTitle}>8. Legal Compliance</Text>
              <Text style={styles.termsText}>
                All parties must comply with local employment laws and regulations. 
                TrustME reserves the right to suspend accounts that violate these terms.
              </Text>
            </ScrollView>

            <View style={styles.termsAcceptance}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setTermsAccepted(!termsAccepted)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.checkbox,
                  termsAccepted && styles.checkboxChecked,
                  { borderColor: termsAccepted ? colors.primary : colors.border }
                ]}>
                  {termsAccepted && (
                    <CheckCircle color={colors.primary} size={16} />
                  )}
                </View>
                <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                  I have read and agree to the terms and conditions
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        );

      case 3:
        return (
          <Card style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <CheckCircle color={colors.primary} size={24} />
              <Text style={styles.stepTitle}>Review & Confirm</Text>
            </View>
            <Text style={styles.stepSubtext}>
              Review all the details before creating the employment offer
            </Text>

            <View style={styles.reviewSection}>
              <Text style={styles.reviewTitle}>Job Details</Text>
              <Text style={styles.reviewValue}>{employmentForm.title}</Text>
              <Text style={styles.reviewDescription}>{employmentForm.description}</Text>
            </View>

            <View style={styles.reviewSection}>
              <Text style={styles.reviewTitle}>Salary & Payment</Text>
              <Text style={styles.reviewValue}>{employmentForm.salary} RWF</Text>
              <Text style={styles.reviewDescription}>Payment Type: {employmentForm.paymentType}</Text>
            </View>

            {employmentForm.startDate && (
              <View style={styles.reviewSection}>
                <Text style={styles.reviewTitle}>Start Date</Text>
                <Text style={styles.reviewValue}>{employmentForm.startDate.toLocaleDateString()}</Text>
              </View>
            )}

            <View style={styles.reviewSection}>
              <Text style={styles.reviewTitle}>Selected Employee</Text>
              <Text style={styles.reviewValue}>{employmentForm.selectedEmployee?.fullName}</Text>
              <Text style={styles.reviewDescription}>Code: {employmentForm.selectedEmployee?.code}</Text>
            </View>
          </Card>
        );



      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        if (currentSubStep === 0) {
          return false; // Sub-step 0 (scan) - no proceed button
        } else {
          return scannedEmployeeData !== null; // Sub-step 1 (profile) - can proceed when employee data is available
        }
      case 1:
        return employmentForm.title.trim().length > 0; // Job details step
      case 2:
        return termsAccepted; // Terms step - can proceed when terms are accepted
      case 3:
        return true; // Review step - always can proceed
      default:
        return false;
    }
  };

  const canGoBack = () => {
    if (currentStep === 0 && currentSubStep === 0) {
      return false; // Can't go back from sub-step 0
    }
    return currentStep > 0 || currentSubStep > 0;
  };

  if (createEmploymentMutation.isPending) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <Text style={styles.loadingText}>Creating employment offer...</Text>
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
        <Text style={styles.title}>Create Employment</Text>
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
        {currentStep === 0 && currentSubStep === 1 && scannedEmployeeData ? (
          <TouchableOpacity
            style={[styles.navButton, styles.cancelButton]}
            onPress={handleCancel}
            activeOpacity={0.8}
          >
            <XCircle color={colors.error} size={20} style={styles.navButtonIcon} />
            <Text style={[styles.navButtonText, { color: colors.error }]}>Cancel</Text>
          </TouchableOpacity>
        ) : canGoBack() ? (
          <TouchableOpacity
            style={[styles.navButton, styles.previousButton]}
            onPress={handlePrevious}
            activeOpacity={0.8}
          >
            <ChevronLeft color={colors.primary} size={20} style={styles.navButtonIcon} />
            <Text style={[styles.navButtonText, { color: colors.primary }]}>Previous</Text>
          </TouchableOpacity>
        ) : null}
        
        {currentStep === 0 && currentSubStep === 1 && scannedEmployeeData ? (
          <TouchableOpacity
            style={[styles.navButton, styles.proceedButton]}
            onPress={handleProceed}
            disabled={!canProceed()}
            activeOpacity={0.8}
          >
            <CheckCircle color={colors.white} size={20} style={styles.navButtonIcon} />
            <Text style={[styles.navButtonText, { color: colors.white }]}>Select Employee</Text>
          </TouchableOpacity>
        ) : currentStep < 3 ? (
          <TouchableOpacity
            style={[styles.navButton, styles.nextButton]}
            onPress={handleNext}
            disabled={!canProceed()}
            activeOpacity={0.8}
          >
            <ChevronRight color={colors.white} size={20} style={styles.navButtonIcon} />
            <Text style={[styles.navButtonText, { color: colors.white }]}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navButton, styles.createButton]}
            onPress={handleSubmit}
            disabled={!canProceed()}
            activeOpacity={0.8}
          >
            <CheckCircle color={colors.white} size={20} style={styles.navButtonIcon} />
            <Text style={[styles.navButtonText, { color: colors.white }]}>Create Employment</Text>
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
    content: {
      flex: 1,
      paddingHorizontal: Spacing.sm,
    },
    stepCard: {
      marginBottom: Spacing.md,
      borderRadius: BorderRadius.lg,
      overflow: 'hidden',
      padding: Spacing.md,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
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
    },
    input: {
      marginBottom: Spacing.md,
    },
    descriptionLabel: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    descriptionInput: {
      marginBottom: Spacing.md,
      minHeight: 100,
      textAlignVertical: 'top',
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.text,
      backgroundColor: colors.card,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
    },
    paymentTypeLabel: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      marginBottom: Spacing.sm,
    },
    paymentTypeOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    paymentTypeOption: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    paymentTypeOptionActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    paymentTypeText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
      color: colors.text,
    },
    paymentTypeTextActive: {
      color: colors.white,
    },
    datePickerContainer: {
      marginBottom: Spacing.md,
    },
    dateLabel: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      marginBottom: Spacing.sm,
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
      marginBottom: Spacing.sm,
    },
    datePickerButtonText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.primary,
      marginLeft: Spacing.sm,
    },
    clearDateButton: {
      alignSelf: 'flex-end',
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
    manualInputSection: {
      marginTop: Spacing.md,
    },
    manualInputLabel: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      marginBottom: Spacing.sm,
    },
    manualInputContainer: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    manualInput: {
      flex: 1,
    },
    manualSubmitButton: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 80,
    },
    manualSubmitButtonText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.white,
    },
    manualSubmitButtonDisabled: {
      opacity: 0.7,
    },
    employeeCard: {
      marginBottom: Spacing.md,
      padding: Spacing.lg,
    },
    employeeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    employeeAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    employeeInfo: {
      flex: 1,
    },
    employeeName: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    employeeCode: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
      color: colors.primary,
    },
    employeeStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: Spacing.md,
      paddingVertical: Spacing.md,
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.md,
    },
    employeeActions: {
      marginTop: Spacing.md,
    },
    selectEmployeeButton: {
      backgroundColor: colors.primary,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
    },
    selectEmployeeButtonText: {
      color: colors.white,
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-SemiBold',
    },
    employeeStatusContainer: {
      flexDirection: 'row',
      marginTop: Spacing.sm,
      gap: Spacing.sm,
    },
    statusBadge: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.sm,
    },
    statusText: {
      fontSize: Typography.fontSize.xs,
      fontFamily: 'DMSans-SemiBold',
    },
    trustabilityBadge: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.sm,
    },
    trustabilityText: {
      fontSize: Typography.fontSize.xs,
      fontFamily: 'DMSans-SemiBold',
    },
    locationSection: {
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    locationTitle: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-SemiBold',
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    locationDetails: {
      gap: Spacing.xs,
    },
    locationText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.text,
    },
    locationSubtext: {
      fontSize: Typography.fontSize.xs,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
    },
    contactSection: {
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    contactTitle: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-SemiBold',
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    contactDetails: {
      gap: Spacing.xs,
    },
    contactText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.text,
    },
    summarySection: {
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    summaryTitle: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-SemiBold',
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    summaryText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      lineHeight: 20,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    statLabel: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
      color: colors.textSecondary,
    },
    availabilityInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.md,
    },
    availabilityLabel: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.text,
    },
    availabilityStatus: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-SemiBold',
    },
    locationInfo: {
      marginTop: Spacing.sm,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.md,
    },
    locationLabel: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.text,
      marginBottom: Spacing.xs,
    },

    reviewSection: {
      marginBottom: Spacing.md,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.md,
    },
    reviewTitle: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-SemiBold',
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    reviewValue: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    reviewDescription: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
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
    cancelButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.error,
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
    // Terms and Conditions Styles
    termsContainer: {
      maxHeight: 300,
      marginBottom: Spacing.lg,
      paddingHorizontal: Spacing.sm,
    },
    termsTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginBottom: Spacing.md,
      textAlign: 'center',
    },
    termsSectionTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-SemiBold',
      color: colors.text,
      marginTop: Spacing.md,
      marginBottom: Spacing.sm,
    },
    termsText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: Spacing.sm,
    },
    termsAcceptance: {
      marginTop: Spacing.lg,
      paddingHorizontal: Spacing.sm,
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 4,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.sm,
    },
    checkboxChecked: {
      backgroundColor: colors.primary + '10',
    },
    checkboxLabel: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      flex: 1,
      lineHeight: 20,
    },
  });
