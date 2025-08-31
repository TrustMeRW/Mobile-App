import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation, SUPPORTED_LANGUAGES, SupportedLanguage } from '@/contexts/TranslationContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { ArrowLeft, Check, Globe, AlertCircle } from 'lucide-react-native';
import { MotiView } from 'moti';

export default function LanguageSettingsScreen() {
  const { colors } = useTheme();
  const { currentLanguage, setLanguage, t } = useTranslation();
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(currentLanguage);
  const [isChanging, setIsChanging] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleLanguageChange = async () => {
    if (selectedLanguage === currentLanguage) {
      router.back();
      return;
    }

    setIsChanging(true);
    try {
      await setLanguage(selectedLanguage);
      setShowConfirmModal(false);
      // Navigate back after successful language change
      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (error) {
      console.error('Language change error:', error);
    } finally {
      setIsChanging(false);
    }
  };

  const confirmLanguageChange = () => {
    setShowConfirmModal(true);
  };

  const styles = getStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('language.settings.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
        >
          <Card style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Globe color={colors.primary} size={24} />
              <Text style={styles.infoTitle}>{t('language.settings.infoTitle')}</Text>
            </View>
            <Text style={styles.infoText}>
              {t('language.settings.infoText')}
            </Text>
          </Card>

          <Card style={styles.languagesCard}>
            <Text style={styles.sectionTitle}>{t('language.settings.selectLanguage')}</Text>
            
            {Object.values(SUPPORTED_LANGUAGES).map((language, index) => (
              <MotiView
                key={language.code}
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{
                  type: 'timing',
                  duration: 400,
                  delay: index * 100,
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.languageItem,
                    selectedLanguage === language.code && styles.selectedLanguageItem
                  ]}
                  onPress={() => setSelectedLanguage(language.code)}
                >
                  <View style={styles.languageInfo}>
                    <Text style={styles.languageFlag}>{language.flag}</Text>
                    <View style={styles.languageDetails}>
                      <Text style={styles.languageName}>{language.name}</Text>
                      <Text style={styles.languageNativeName}>{language.nativeName}</Text>
                    </View>
                  </View>
                  
                  {selectedLanguage === language.code && (
                    <View style={[styles.checkIcon, { backgroundColor: colors.primary }]}>
                      <Check color={colors.white} size={16} />
                    </View>
                  )}
                </TouchableOpacity>
              </MotiView>
            ))}
          </Card>

          <View style={styles.buttonContainer}>
            <Button
              title={t('language.settings.confirmButton')}
              onPress={confirmLanguageChange}
              disabled={selectedLanguage === currentLanguage}
              style={[
                styles.confirmButton,
                selectedLanguage === currentLanguage && styles.disabledButton
              ]}
            />
          </View>
        </MotiView>
      </ScrollView>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isVisible={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleLanguageChange}
        title={t('language.changeConfirm.title')}
        message={t('language.changeConfirm.message', { language: SUPPORTED_LANGUAGES[selectedLanguage].name })}
        confirmText={t('language.changeConfirm.confirmText')}
        cancelText={t('language.changeConfirm.cancelText')}
        icon={<AlertCircle color={colors.primary} size={24} />}
        iconColor={colors.primary}
      />
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
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
    infoHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    infoTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginLeft: Spacing.sm,
    },
    infoText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      lineHeight: 22,
    },
    languagesCard: {
      marginBottom: Spacing.lg,
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
    sectionTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginBottom: Spacing.md,
    },
    languageItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    selectedLanguageItem: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    languageInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    languageFlag: {
      fontSize: 24,
      marginRight: Spacing.md,
    },
    languageDetails: {
      flex: 1,
    },
    languageName: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    languageNativeName: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
    },
    checkIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonContainer: {
      marginTop: Spacing.lg,
    },
    confirmButton: {
      width: '100%',
    },
    disabledButton: {
      opacity: 0.6,
    },
  });
