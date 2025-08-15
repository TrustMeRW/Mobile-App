import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
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
import { ChevronLeft, Eye, EyeOff } from 'lucide-react-native';

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    keyboardView: {
      flex: 1,
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
    subtitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      marginBottom: Spacing.xl,
    },
    section: {
      marginBottom: Spacing.lg,
    },
    sectionTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-SemiBold',
      color: colors.text,
      marginBottom: Spacing.md,
    },
    label: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    registerButton: {
      marginTop: Spacing.lg,
      marginBottom: Spacing.xl,
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

export default function RegisterScreen() {
  const { theme, colors } = useTheme();
  const isDark = theme === 'dark';
  const styles = getStyles(colors, isDark);
  const [formData, setFormData] = useState({
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

  const toggleShowPin = useCallback(() => setShowPin((prev) => !prev), []);
  const toggleShowConfirmPin = useCallback(
    () => setShowConfirmPin((prev) => !prev),
    []
  );

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { pin, confirmPin, email, phoneNumber, nationalId } = formData;

    if (pin !== confirmPin) {
      Toast.show({
        type: 'error',
        text1: 'PIN Mismatch',
        text2: 'PINs do not match',
      });
      return false;
    }

    if (pin.length < 4 || pin.length > 20) {
      Toast.show({
        type: 'error',
        text1: 'Invalid PIN',
        text2: 'PIN must be between 4 and 20 characters',
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Email',
        text2: 'Please enter a valid email address',
      });
      return false;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber.replace(/[^0-9]/g, ''))) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Phone',
        text2: 'Please enter a valid 10-digit phone number',
      });
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { confirmPin, ...registrationData } = formData;
      await apiClient.register(registrationData);

      Toast.show({
        type: 'success',
        text1: 'Registration Successful',
        text2: 'Please check your email for verification',
      });

      router.push('/(auth)/login');
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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Button
            title=""
            onPress={() => router.back()}
            variant="ghost"
            style={styles.backButton}
          />
          <ChevronLeft color={colors.text} size={24} />
          <Text style={styles.title}>Create Account</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600 }}
          >
            <Text style={styles.subtitle}>
              Fill in your details to get started
            </Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Information</Text>

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
                label="Email"
                value={formData.email}
                onChangeText={(value) => updateField('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                required
              />

              <Input
                label="Phone Number"
                value={formData.phoneNumber}
                onChangeText={(value) => updateField('phoneNumber', value)}
                keyboardType="phone-pad"
                required
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>

              <Input
                label="Province"
                value={formData.province}
                onChangeText={(value) => updateField('province', value)}
                required
              />

              <Input
                label="District"
                value={formData.district}
                onChangeText={(value) => updateField('district', value)}
                required
              />

              <Input
                label="Sector"
                value={formData.sector}
                onChangeText={(value) => updateField('sector', value)}
                required
              />

              <Input
                label="Cell"
                value={formData.cell}
                onChangeText={(value) => updateField('cell', value)}
                required
              />

              <Input
                label="Village"
                value={formData.village}
                onChangeText={(value) => updateField('village', value)}
                required
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Security</Text>

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
            </View>

            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              style={styles.registerButton}
            />
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
