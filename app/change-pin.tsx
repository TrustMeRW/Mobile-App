import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Eye, EyeOff, Shield } from 'lucide-react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/contexts/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { apiClient } from '@/services/api';
import Toast from 'react-native-toast-message';
import { MotiView } from 'moti';

export default function ChangePinScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [pinStrength, setPinStrength] = useState<'weak' | 'medium' | 'strong'>('weak');

  // Calculate PIN strength
  const calculatePinStrength = (pin: string) => {
    if (pin.length < 4) return 'weak';
    if (pin.length >= 6) return 'strong';
    return 'medium';
  };

  const handleNewPinChange = (pin: string) => {
    setNewPin(pin);
    setPinStrength(calculatePinStrength(pin));
  };

  const changePinMutation = useMutation({
    mutationFn: (data: { currentPin: string; newPin: string }) =>
      apiClient.changePin(data.currentPin, data.newPin),
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'PIN Changed Successfully',
        text2: 'Your PIN has been updated successfully',
      });
      // Invalidate profile query to refresh user data
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      router.back();
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'PIN Change Failed',
        text2: error.message || 'Failed to change PIN. Please try again.',
      });
    },
  });

  const handleChangePin = () => {
    // Validation
    if (!currentPin || !newPin || !confirmPin) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPin.length < 4) {
      Alert.alert('Error', 'New PIN must be at least 4 digits');
      return;
    }

    if (newPin !== confirmPin) {
      Alert.alert('Error', 'New PIN and confirm PIN do not match');
      return;
    }

    if (newPin === currentPin) {
      Alert.alert('Error', 'New PIN must be different from current PIN');
      return;
    }

    // Confirm action
    Alert.alert(
      'Confirm PIN Change',
      'Are you sure you want to change your PIN? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change PIN',
          style: 'destructive',
          onPress: () => {
            changePinMutation.mutate({ currentPin, newPin });
          },
        },
      ]
    );
  };

  // Check if form is valid
  const isFormValid = () => {
    return currentPin.length > 0 && 
           newPin.length >= 4 && 
           confirmPin.length > 0 && 
           newPin === confirmPin && 
           newPin !== currentPin;
  };

  const toggleShowCurrentPin = () => setShowCurrentPin(!showCurrentPin);
  const toggleShowNewPin = () => setShowNewPin(!showNewPin);
  const toggleShowConfirmPin = () => setShowConfirmPin(!showConfirmPin);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Change PIN</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600 }}
          >
            <Card style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Shield color={colors.primary} size={24} />
                <Text style={styles.infoTitle}>Security Information</Text>
              </View>
              <Text style={styles.infoText}>
                Your PIN is used to secure your account and confirm important actions. 
                Make sure to choose a PIN that you can remember but others cannot easily guess.
              </Text>
            </Card>

            <Card style={styles.formCard}>
              <Text style={styles.sectionTitle}>Current PIN</Text>
              <View style={styles.inputContainer}>
                <Input
                  label="Enter Current PIN"
                  placeholder="Enter your current PIN"
                  value={currentPin}
                  onChangeText={setCurrentPin}
                  secureTextEntry={!showCurrentPin}
                  keyboardType="numeric"
                  maxLength={6}
                  style={styles.input}
                />
                <TouchableOpacity
                  onPress={toggleShowCurrentPin}
                  style={styles.eyeButton}
                  activeOpacity={0.7}
                >
                  {showCurrentPin ? (
                    <EyeOff size={20} color={colors.textSecondary} />
                  ) : (
                    <Eye size={20} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionTitle}>New PIN</Text>
              <View style={styles.inputContainer}>
                <Input
                  label="Enter New PIN"
                  placeholder="Enter your new PIN"
                  value={newPin}
                  onChangeText={handleNewPinChange}
                  secureTextEntry={!showNewPin}
                  keyboardType="numeric"
                  maxLength={6}
                  style={styles.input}
                />
                <TouchableOpacity
                  onPress={toggleShowNewPin}
                  style={styles.eyeButton}
                  activeOpacity={0.7}
                >
                  {showNewPin ? (
                    <EyeOff size={20} color={colors.textSecondary} />
                  ) : (
                    <Eye size={20} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
              
              {/* PIN Strength Indicator */}
              {newPin.length > 0 && (
                <View style={styles.strengthContainer}>
                  <Text style={styles.strengthLabel}>PIN Strength:</Text>
                  <View style={styles.strengthBar}>
                    <View 
                      style={[
                        styles.strengthFill, 
                        { 
                          width: `${(newPin.length / 6) * 100}%`,
                          backgroundColor: pinStrength === 'weak' ? colors.error : 
                                        pinStrength === 'medium' ? colors.warning : colors.success
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[
                    styles.strengthText,
                    { 
                      color: pinStrength === 'weak' ? colors.error : 
                             pinStrength === 'medium' ? colors.warning : colors.success
                    }
                  ]}>
                    {pinStrength.charAt(0).toUpperCase() + pinStrength.slice(1)}
                  </Text>
                </View>
              )}

              <Text style={styles.sectionTitle}>Confirm New PIN</Text>
              <View style={styles.inputContainer}>
                <Input
                  label="Confirm New PIN"
                  placeholder="Confirm your new PIN"
                  value={confirmPin}
                  onChangeText={setConfirmPin}
                  secureTextEntry={!showConfirmPin}
                  keyboardType="numeric"
                  maxLength={6}
                  style={styles.input}
                />
                <TouchableOpacity
                  onPress={toggleShowConfirmPin}
                  style={styles.eyeButton}
                  activeOpacity={0.7}
                >
                  {showConfirmPin ? (
                    <EyeOff size={20} color={colors.textSecondary} />
                  ) : (
                    <Eye size={20} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>

              {/* PIN Requirements */}
              <View style={styles.requirementsContainer}>
                <Text style={styles.requirementsTitle}>PIN Requirements:</Text>
                <View style={styles.requirementItem}>
                  <View style={[
                    styles.requirementDot,
                    { backgroundColor: newPin.length >= 4 ? colors.success : colors.border }
                  ]} />
                  <Text style={[
                    styles.requirementText,
                    { color: newPin.length >= 4 ? colors.success : colors.textSecondary }
                  ]}>
                    At least 4 digits
                  </Text>
                </View>
                <View style={styles.requirementItem}>
                  <View style={[
                    styles.requirementDot,
                    { backgroundColor: newPin !== currentPin ? colors.success : colors.border }
                  ]} />
                  <Text style={[
                    styles.requirementText,
                    { color: newPin !== currentPin ? colors.success : colors.textSecondary }
                  ]}>
                    Different from current PIN
                  </Text>
                </View>
                <View style={styles.requirementItem}>
                  <View style={[
                    styles.requirementDot,
                    { backgroundColor: newPin === confirmPin && confirmPin.length > 0 ? colors.success : colors.border }
                  ]} />
                  <Text style={[
                    styles.requirementText,
                    { color: newPin === confirmPin && confirmPin.length > 0 ? colors.success : colors.textSecondary }
                  ]}>
                    PINs match
                  </Text>
                </View>
              </View>
            </Card>

            <View style={styles.buttonContainer}>
              <Button
                title="Change PIN"
                onPress={handleChangePin}
                loading={changePinMutation.isPending}
                disabled={changePinMutation.isPending || !isFormValid()}
                style={styles.changeButton}
              />
            </View>
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>
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
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.sm,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: Spacing.sm,
    },
    title: {
      fontSize: Typography.fontSize.xl,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
    },
    content: {
      flex: 1,
      padding: Spacing.lg,
    },
    infoCard: {
      marginBottom: Spacing.lg,
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary + '20',
    },
    infoHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    infoTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Bold',
      color: colors.primary,
      marginLeft: Spacing.sm,
    },
    infoText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      lineHeight: 20,
    },
    formCard: {
      marginBottom: Spacing.lg,
    },
    sectionTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginBottom: Spacing.sm,
      marginTop: Spacing.md,
    },
    inputContainer: {
      position: 'relative',
      marginBottom: Spacing.md,
    },
    input: {
      width: '100%',
      marginBottom: 0,
      paddingRight: 40,
    },
    eyeButton: {
      position: 'absolute',
      right: 0,
      top: 32,
      padding: 8,
      zIndex: 10,
    },
    buttonContainer: {
      marginTop: Spacing.lg,
    },
    changeButton: {
      width: '100%',
    },
    strengthContainer: {
      marginTop: Spacing.sm,
      marginBottom: Spacing.md,
    },
    strengthLabel: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    strengthBar: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: BorderRadius.md,
      overflow: 'hidden',
      marginBottom: Spacing.xs,
    },
    strengthFill: {
      height: '100%',
      borderRadius: BorderRadius.md,
    },
    strengthText: {
      fontSize: Typography.fontSize.xs,
      fontFamily: 'DMSans-Regular',
    },
    requirementsContainer: {
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    requirementsTitle: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    requirementItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.xs,
    },
    requirementDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: Spacing.xs,
    },
    requirementText: {
      fontSize: Typography.fontSize.xs,
      fontFamily: 'DMSans-Regular',
    },
  });
