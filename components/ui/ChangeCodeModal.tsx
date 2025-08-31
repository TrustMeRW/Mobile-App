import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/contexts/TranslationContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { Button } from './Button';
import { QrCode, X, Eye, EyeOff, Lock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react-native';

interface ChangeCodeModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: (pin: string) => void;
  isLoading?: boolean;
}

const { height: screenHeight } = Dimensions.get('window');

export const ChangeCodeModal: React.FC<ChangeCodeModalProps> = ({
  isVisible,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'input' | 'confirm' | 'success'>('input');

  const handleSubmit = () => {
    if (!pin.trim()) {
      setError(t('changeCode.error.emptyCode'));
      return;
    }

    if (pin.length < 4) {
      setError(t('changeCode.error.tooShort'));
      return;
    }

    if (pin.length > 6) {
      setError(t('changeCode.error.tooLong'));
      return;
    }

    setError('');
    setStep('confirm');
  };

  const handleConfirmNewCode = () => {
    if (pin !== confirmPin) {
      setError(t('changeCode.error.mismatch'));
      return;
    }

    setError('');
    setStep('success');
    
    // Call the onConfirm function
    onConfirm(pin);
    
    // Reset and close after a delay
    setTimeout(() => {
      resetAndClose();
    }, 2000);
  };

  const resetAndClose = () => {
    setPin('');
    setConfirmPin('');
    setShowPin(false);
    setError('');
    setStep('input');
    onClose();
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('input');
      setConfirmPin('');
      setError('');
    }
  };

  const handleClose = () => {
    resetAndClose();
  };

  const renderInputStep = () => (
    <>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={[styles.iconContainer, { backgroundColor: colors.warning + '15' }]}>
            <AlertTriangle color={colors.warning} size={24} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{t('changeCode.input.title')}</Text>
        </View>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <X color={colors.textSecondary} size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {t('changeCode.input.message')}
        </Text>

        <View style={styles.pinInputContainer}>
          <Text style={[styles.pinInputLabel, { color: colors.text }]}>
            {t('changeCode.input.newCodeLabel')}
          </Text>
          <View style={[styles.pinInputWrapper, { borderColor: error ? colors.error : colors.border }]}>
            <Lock color={colors.textSecondary} size={20} style={styles.pinInputIcon} />
            <TextInput
              value={pin}
              onChangeText={setPin}
              keyboardType="default"
              placeholder={t('changeCode.input.placeholder')}
              secureTextEntry={!showPin}
              maxLength={6}
              returnKeyType="done"
              blurOnSubmit={true}
              style={[styles.pinInputField, { color: colors.text }]}
              placeholderTextColor={colors.textSecondary}
            />
            <TouchableOpacity
              onPress={() => setShowPin(!showPin)}
              style={styles.pinInputSuffix}
            >
              {showPin ? (
                <EyeOff color={colors.textSecondary} size={20} />
              ) : (
                <Eye color={colors.textSecondary} size={20} />
              )}
            </TouchableOpacity>
          </View>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            {t('changeCode.input.hint')}
          </Text>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <XCircle color={colors.error} size={16} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.buttonContainer}>
          <Button
            title={t('changeCode.input.next')}
            onPress={handleSubmit}
            disabled={!pin.trim()}
            style={styles.button}
          />
        </View>
      </View>
    </>
  );

  const renderConfirmStep = () => (
    <>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
            <AlertTriangle color={colors.primary} size={24} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{t('changeCode.confirm.title')}</Text>
        </View>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <X color={colors.textSecondary} size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {t('changeCode.confirm.message')}
        </Text>

        <View style={styles.pinInputContainer}>
          <Text style={[styles.pinInputLabel, { color: colors.text }]}>
            {t('changeCode.confirm.confirmCodeLabel')}
          </Text>
          <View style={[styles.pinInputWrapper, { borderColor: error ? colors.error : colors.border }]}>
            <Lock color={colors.textSecondary} size={20} style={styles.pinInputIcon} />
            <TextInput
              value={confirmPin}
              onChangeText={setConfirmPin}
              keyboardType="default"
              placeholder={t('changeCode.confirm.placeholder')}
              secureTextEntry={!showPin}
              maxLength={6}
              returnKeyType="done"
              blurOnSubmit={true}
              style={[styles.pinInputField, { color: colors.text }]}
              placeholderTextColor={colors.textSecondary}
            />
            <TouchableOpacity
              onPress={() => setShowPin(!showPin)}
              style={styles.pinInputSuffix}
            >
              {showPin ? (
                <EyeOff color={colors.textSecondary} size={20} />
              ) : (
                <Eye color={colors.textSecondary} size={20} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <XCircle color={colors.error} size={16} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.buttonContainer}>
          <Button
            title={t('changeCode.confirm.back')}
            onPress={handleBack}
            variant="outline"
            style={styles.button}
          />
          <Button
            title={t('changeCode.confirm.confirm')}
            onPress={handleConfirmNewCode}
            disabled={!confirmPin.trim()}
            style={styles.button}
          />
        </View>
      </View>
    </>
  );

  const renderSuccessStep = () => (
    <>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={[styles.iconContainer, { backgroundColor: colors.success + '15' }]}>
            <CheckCircle color={colors.success} size={24} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{t('changeCode.success.title')}</Text>
        </View>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <X color={colors.textSecondary} size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {t('changeCode.success.message')}
        </Text>

        <View style={styles.buttonContainer}>
          <Button
            title={t('changeCode.success.close')}
            onPress={handleClose}
            style={styles.button}
          />
        </View>
      </View>
    </>
  );

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        
        <View style={[styles.modal, { backgroundColor: colors.card }]}>
          {step === 'input' && renderInputStep()}
          {step === 'confirm' && renderConfirmStep()}
          {step === 'success' && renderSuccessStep()}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  modal: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingBottom: 40, // Safe area for bottom
    maxHeight: screenHeight * 0.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontFamily: 'DMSans-Bold',
  },
  closeButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  message: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Regular',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  pinInputContainer: {
    marginBottom: Spacing.md,
  },
  pinInputLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Medium',
    marginBottom: Spacing.xs,
  },
  pinInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  pinInputIcon: {
    marginLeft: Spacing.md,
    marginRight: Spacing.sm,
  },
  pinInputField: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Regular',
    minHeight: 48,
  },
  pinInputSuffix: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-SemiBold',
  },
  changeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  changeButtonText: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-SemiBold',
    color: 'white',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  errorText: {
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Regular',
  },
  hint: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Regular',
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  button: {
    flex: 1,
  },
});
