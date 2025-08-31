import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Typography, Spacing } from '@/constants/theme';
import { MotiView } from 'moti';
import { Phone, Camera, User as UserIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useRegister } from '@/hooks';

interface RegisterTabProps {
  onSwitchTab: (tab: 'login' | 'register' | 'forgot-password') => void;
}

export default function RegisterTab({ onSwitchTab }: RegisterTabProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [idCardUpper, setIdCardUpper] = useState<string | null>(null);
  const [idCardLower, setIdCardLower] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const registerMutation = useRegister();

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Please grant camera permission to take photos for registration.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const takePhoto = async (type: 'idUpper' | 'idLower' | 'selfie') => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'selfie' ? [1, 1] : [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        switch (type) {
          case 'idUpper':
            setIdCardUpper(imageUri);
            break;
          case 'idLower':
            setIdCardLower(imageUri);
            break;
          case 'selfie':
            setSelfie(imageUri);
            break;
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleRegister = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    if (!idCardUpper) {
      Alert.alert('Error', 'Please take a photo of the upper section of your ID card');
      return;
    }

    if (!idCardLower) {
      Alert.alert('Error', 'Please take a photo of the lower section of your ID card');
      return;
    }

    if (!selfie) {
      Alert.alert('Error', 'Please take a selfie photo');
      return;
    }

    registerMutation.mutate({
      phoneNumber: phoneNumber.trim(),
      idCardUpper,
      idCardLower,
      selfie,
    });
  };

  // Handle successful registration
  React.useEffect(() => {
    if (registerMutation.isSuccess && registerMutation.data?.success) {
      // Switch to login tab after successful registration
      onSwitchTab('login');
    }
  }, [registerMutation.isSuccess, registerMutation.data, onSwitchTab]);

  const isFormComplete = phoneNumber.trim() && idCardUpper && idCardLower && selfie;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 500 }}
      style={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>
          Complete your registration with TrustMe
        </Text>
      </View>

      {/* Phone Number Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Phone Number</Text>
        <View style={styles.inputWrapper}>
          <Phone size={20} color={colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="Enter your phone number"
            placeholderTextColor="#9ca3af"
            keyboardType="phone-pad"
            autoCapitalize="none"
            style={styles.input}
            editable={true}
            selectTextOnFocus={true}
            blurOnSubmit={false}
          />
        </View>
      </View>

      {/* ID Card Photos Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Identification Card</Text>
        <Text style={styles.sectionSubtitle}>
          Take photos of your ID card (Passport/National ID)
        </Text>

        {/* ID Card Upper Section */}
        <View style={styles.photoContainer}>
          <Text style={styles.photoLabel}>Upper Section</Text>
          <TouchableOpacity
            style={styles.photoButton}
            onPress={() => takePhoto('idUpper')}
          >
            {idCardUpper ? (
              <Image source={{ uri: idCardUpper }} style={styles.photoPreview} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Camera size={32} color={colors.textSecondary} />
                <Text style={styles.photoPlaceholderText}>Take Photo</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ID Card Lower Section */}
        <View style={styles.photoContainer}>
          <Text style={styles.photoLabel}>Lower Section</Text>
          <TouchableOpacity
            style={styles.photoButton}
            onPress={() => takePhoto('idLower')}
          >
            {idCardLower ? (
              <Image source={{ uri: idCardLower }} style={styles.photoPreview} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Camera size={32} color={colors.textSecondary} />
                <Text style={styles.photoPlaceholderText}>Take Photo</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Selfie Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Selfie Photo</Text>
        <Text style={styles.sectionSubtitle}>
          Take a clear photo of yourself
        </Text>

        <View style={styles.photoContainer}>
          <TouchableOpacity
            style={styles.photoButton}
            onPress={() => takePhoto('selfie')}
          >
            {selfie ? (
              <Image source={{ uri: selfie }} style={styles.photoPreview} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <UserIcon size={32} color={colors.textSecondary} />
                <Text style={styles.photoPlaceholderText}>Take Selfie</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Register Button */}
      <LinearGradient
        colors={['#080C1C', '#253882']}
        style={styles.registerButtonGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
                  <TouchableOpacity
            style={[styles.registerButton, !isFormComplete && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={!isFormComplete || registerMutation.isPending}
          >
            {registerMutation.isPending ? (
              <Text style={styles.registerButtonText}>Processing...</Text>
            ) : (
              <Text style={styles.registerButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>
      </LinearGradient>

      {/* Login Link */}
      <View style={styles.loginLinkContainer}>
        <Text style={styles.loginLinkText}>
          Already have an account?{' '}
                      <Text
              style={styles.loginLink}
              onPress={() => onSwitchTab('login')}
            >
              Sign In
            </Text>
        </Text>
      </View>
    </MotiView>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    content: {
      flex: 1,
    },
    header: {
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    title: {
      fontSize: Typography.fontSize.xl,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    subtitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    inputContainer: {
      marginBottom: Spacing.lg,
      width: '100%',
    },
    inputLabel: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: Spacing.md,
      width: '100%',
      minHeight: 52,
    },
    inputIcon: {
      marginRight: Spacing.sm,
    },
    input: {
      flex: 1,
      fontSize: Typography.fontSize.md,
      color: colors.text,
      paddingVertical: 12,
    },
    sectionContainer: {
      marginBottom: Spacing.xl,
    },
    sectionTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    sectionSubtitle: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      marginBottom: Spacing.md,
    },
    photoContainer: {
      marginBottom: Spacing.md,
    },
    photoLabel: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    photoButton: {
      width: '100%',
      height: 120,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: colors.border,
      borderStyle: 'dashed',
    },
    photoPlaceholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    photoPlaceholderText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
      color: colors.textSecondary,
      marginTop: Spacing.xs,
    },
    photoPreview: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    registerButtonGradient: {
      marginBottom: Spacing.lg,
      borderRadius: 12,
      overflow: 'hidden',
    },
    registerButton: {
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 56,
    },
    registerButtonDisabled: {
      opacity: 0.6,
    },
    registerButtonText: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-Bold',
      color: '#ffffff',
      textAlign: 'center',
    },
    loginLinkContainer: {
      alignItems: 'center',
      marginTop: Spacing.md,
    },
    loginLinkText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    loginLink: {
      color: colors.primary,
      fontFamily: 'DMSans-Bold',
      textDecorationLine: 'underline',
    },
  });
