import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/contexts/TranslationContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { apiClient } from '@/services/api';
import Toast from 'react-native-toast-message';
import { MotiView } from 'moti';

interface PinInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry: boolean;
  onToggleVisibility: () => void;
  error?: string;
}

const PinInput: React.FC<PinInputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  onToggleVisibility,
  error,
}) => {
  const { colors } = useTheme();
  const styles = getPinInputStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, error && styles.inputError]}>
        <Lock color={colors.textSecondary} size={20} style={styles.inputIcon} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={secureTextEntry}
          keyboardType="default"
          maxLength={6}
          style={styles.input}
        />
        <TouchableOpacity onPress={onToggleVisibility} style={styles.eyeButton}>
          {secureTextEntry ? (
            <EyeOff color={colors.textSecondary} size={20} />
          ) : (
            <Eye color={colors.textSecondary} size={20} />
          )}
        </TouchableOpacity>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default function ChangePinScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = getStyles(colors);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const changePinMutation = useMutation({
    mutationFn: (data: { currentPin: string; newPin: string }) =>
      apiClient.changePin(data.currentPin, data.newPin),
    onSuccess: () => {
      setIsSuccess(true);
      Toast.show({
        type: 'success',
        text1: t('changePin.success.title'),
        text2: t('changePin.success.message'),
      });
      
      // Invalidate profile query to refresh user data
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      // Navigate back after a delay
      setTimeout(() => {
        router.back();
      }, 2000);
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: t('changePin.error.title'),
        text2: error.message || t('changePin.error.message'),
      });
    },
  });

  const handleSubmit = () => {
    // Validation
    if (!currentPin || !newPin || !confirmPin) {
      Toast.show({
        type: 'error',
        text1: t('changePin.validation.error.title'),
        text2: t('changePin.validation.error.allFieldsRequired'),
      });
      return;
    }

    if (newPin.length < 4) {
      Toast.show({
        type: 'error',
        text1: t('changePin.validation.error.title'),
        text2: t('changePin.validation.error.pinTooShort'),
      });
      return;
    }

    if (newPin.length > 6) {
      Toast.show({
        type: 'error',
        text1: t('changePin.validation.error.title'),
        text2: t('changePin.validation.error.pinTooLong'),
      });
      return;
    }

    if (newPin !== confirmPin) {
      Toast.show({
        type: 'error',
        text1: t('changePin.validation.error.title'),
        text2: t('changePin.validation.error.pinsDoNotMatch'),
      });
      return;
    }

    if (currentPin === newPin) {
      Toast.show({
        type: 'error',
        text1: t('changePin.validation.error.title'),
        text2: t('changePin.validation.error.samePin'),
      });
      return;
    }

    // Show confirmation modal
    setShowConfirmModal(true);
  };

  const handleConfirmChangePin = () => {
    setShowConfirmModal(false);
    changePinMutation.mutate({
      currentPin,
      newPin,
    });
  };

  const resetForm = () => {
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setShowCurrentPin(false);
    setShowNewPin(false);
    setShowConfirmPin(false);
    setIsSuccess(false);
  };

  if (isSuccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color={colors.text} size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('changePin.title')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.scrollView}>
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            style={styles.successContainer}
          >
            <View style={[styles.successIcon, { backgroundColor: colors.success + '15' }]}>
              <CheckCircle color={colors.success} size={48} />
            </View>
            <Text style={styles.successTitle}>{t('changePin.success.title')}</Text>
            <Text style={styles.successMessage}>{t('changePin.success.message')}</Text>
            <Text style={styles.successSubtitle}>{t('changePin.success.subtitle')}</Text>
          </MotiView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('changePin.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600 }}
          >
            <Card style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Lock color={colors.primary} size={24} />
                <Text style={styles.infoTitle}>{t('changePin.info.title')}</Text>
              </View>
              <Text style={styles.infoText}>
                {t('changePin.info.message')}
              </Text>
            </Card>

            <Card style={styles.formCard}>
              <Text style={styles.sectionTitle}>{t('changePin.form.currentPin.title')}</Text>
              
              <PinInput
                label={t('changePin.form.currentPin.label')}
                placeholder={t('changePin.form.currentPin.placeholder')}
                value={currentPin}
                onChangeText={setCurrentPin}
                secureTextEntry={!showCurrentPin}
                onToggleVisibility={() => setShowCurrentPin(!showCurrentPin)}
              />

              <Text style={styles.sectionTitle}>{t('changePin.form.newPin.title')}</Text>
              
              <PinInput
                label={t('changePin.form.newPin.label')}
                placeholder={t('changePin.form.newPin.placeholder')}
                value={newPin}
                onChangeText={setNewPin}
                secureTextEntry={!showNewPin}
                onToggleVisibility={() => setShowNewPin(!showNewPin)}
              />

              <PinInput
                label={t('changePin.form.confirmPin.label')}
                placeholder={t('changePin.form.confirmPin.placeholder')}
                value={confirmPin}
                onChangeText={setConfirmPin}
                secureTextEntry={!showConfirmPin}
                onToggleVisibility={() => setShowConfirmPin(!showConfirmPin)}
              />

              <View style={styles.hintContainer}>
                <Text style={styles.hintTitle}>{t('changePin.form.hint.title')}</Text>
                <Text style={styles.hintText}>{t('changePin.form.hint.message')}</Text>
              </View>
            </Card>

            <View style={styles.buttonContainer}>
              <Button
                title={t('changePin.changeButton')}
                onPress={handleSubmit}
                loading={changePinMutation.isPending}
                disabled={changePinMutation.isPending || !currentPin || !newPin || !confirmPin}
                style={styles.changeButton}
              />
            </View>
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmationModal
        isVisible={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmChangePin}
        title={t('changePin.confirm.title')}
        message={t('changePin.confirm.message')}
        confirmText={t('changePin.confirm.changeButton')}
        cancelText={t('common.cancel')}
        icon={<Lock color={colors.primary} size={24} />}
        iconColor={colors.primary}
      />
    </SafeAreaView>
  );
}

const getPinInputStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      marginBottom: Spacing.md,
    },
    label: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    inputError: {
      borderColor: colors.error,
    },
    inputIcon: {
      marginRight: Spacing.sm,
    },
    input: {
      flex: 1,
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.text,
      paddingRight: Spacing.md,
    },
    eyeButton: {
      padding: Spacing.sm,
    },
    errorText: {
      fontSize: Typography.fontSize.xs,
      color: colors.error,
      marginTop: Spacing.xs,
      fontFamily: 'DMSans-Regular',
    },
  });

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
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: Spacing.lg,
      paddingBottom: Spacing.xl * 2, // Extra padding at bottom for keyboard
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
    buttonContainer: {
      marginTop: Spacing.lg,
    },
    changeButton: {
      width: '100%',
    },
    successContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.lg,
    },
    successIcon: {
      width: 96,
      height: 96,
      borderRadius: 48,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    successTitle: {
      fontSize: Typography.fontSize.xl,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginBottom: Spacing.xs,
      textAlign: 'center',
    },
    successMessage: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: Spacing.sm,
    },
    successSubtitle: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    hintContainer: {
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    hintTitle: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    hintText: {
      fontSize: Typography.fontSize.xs,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
    },
  });
