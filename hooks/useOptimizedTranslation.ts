import { useCallback, useMemo } from 'react';
import { useTranslation } from '@/contexts/TranslationContext';

/**
 * Optimized translation hook that prevents unnecessary re-renders
 * by memoizing translation results and only updating when necessary
 */
export const useOptimizedTranslation = () => {
  const { t, currentLanguage, setLanguage, getSupportedLanguages, isLoading } = useTranslation();

  // Memoize common translations to prevent re-renders
  const commonTranslations = useMemo(() => ({
    welcome: t('common.welcome'),
    next: t('common.next'),
    skip: t('common.skip'),
    done: t('common.done'),
    cancel: t('common.cancel'),
    save: t('common.save'),
    delete: t('common.delete'),
    edit: t('common.edit'),
    loading: t('common.loading'),
    error: t('common.error'),
    success: t('common.success'),
    confirm: t('common.confirm'),
    back: t('common.back'),
  }), [t]);

  // Memoize auth translations
  const authTranslations = useMemo(() => ({
    login: {
      title: t('auth.login.title'),
      subtitle: t('auth.login.subtitle'),
      identifier: t('auth.login.identifier'),
      password: t('auth.login.password'),
      forgotPassword: t('auth.login.forgotPassword'),
      loginButton: t('auth.login.loginButton'),
      createAccount: t('auth.login.createAccount'),
      createAccountLink: t('auth.login.createAccountLink'),
    },
    register: {
      title: t('auth.register.title'),
      subtitle: t('auth.register.subtitle'),
      phoneNumber: t('auth.register.phoneNumber'),
      idCard: t('auth.register.idCard'),
      idCardSubtitle: t('auth.register.idCardSubtitle'),
      upperSection: t('auth.register.upperSection'),
      lowerSection: t('auth.register.lowerSection'),
      selfie: t('auth.register.selfie'),
      selfieSubtitle: t('auth.register.selfieSubtitle'),
      takePhoto: t('auth.register.takePhoto'),
      createAccountButton: t('auth.register.createAccountButton'),
      processing: t('auth.register.processing'),
      alreadyHaveAccount: t('auth.register.alreadyHaveAccount'),
      signIn: t('auth.register.signIn'),
    },
    forgotPassword: {
      title: t('auth.forgotPassword.title'),
      subtitle: t('auth.forgotPassword.subtitle'),
      email: t('auth.forgotPassword.email'),
      sendResetLink: t('auth.forgotPassword.sendResetLink'),
      rememberPin: t('auth.forgotPassword.rememberPin'),
      signIn: t('auth.forgotPassword.signIn'),
    },
  }), [t]);

  // Memoize onboarding translations
  const onboardingTranslations = useMemo(() => ({
    step1: {
      title: t('onboarding.step1.title'),
      subtitle: t('onboarding.step1.subtitle'),
    },
    step2: {
      title: t('onboarding.step2.title'),
      subtitle: t('onboarding.step2.subtitle'),
    },
    step3: {
      title: t('onboarding.step3.title'),
      subtitle: t('onboarding.step3.subtitle'),
    },
    step4: {
      title: t('onboarding.step4.title'),
      subtitle: t('onboarding.step4.subtitle'),
    },
  }), [t]);

  // Memoize home translations
  const homeTranslations = useMemo(() => ({
    greeting: t('home.greeting'),
    subGreeting: t('home.subGreeting'),
    totalDebt: t('home.totalDebt'),
    totalPaid: t('home.totalPaid'),
    activeDebts: t('home.activeDebts'),
    overdue: t('home.overdue'),
    recentActivity: t('home.recentActivity'),
    debtRequest: t('home.debtRequest'),
    debtOffer: t('home.debtOffer'),
    noRecentActivity: t('home.noRecentActivity'),
  }), [t]);

  // Memoize language translations
  const languageTranslations = useMemo(() => ({
    english: t('languages.english'),
    kinyarwanda: t('languages.kinyarwanda'),
    french: t('languages.french'),
    selectLanguage: t('languages.selectLanguage'),
    languageDescription: t('languages.languageDescription'),
  }), [t]);

  // Optimized translation function that only updates when language changes
  const optimizedT = useCallback((key: string, params?: Record<string, string | number>): string => {
    return t(key, params);
  }, [t]);

  return {
    // Translation function
    t: optimizedT,
    
    // Memoized translation groups
    common: commonTranslations,
    auth: authTranslations,
    onboarding: onboardingTranslations,
    home: homeTranslations,
    languages: languageTranslations,
    
    // Context values
    currentLanguage,
    setLanguage,
    getSupportedLanguages,
    isLoading,
  };
};

/**
 * Hook for getting specific translation groups to minimize re-renders
 */
export const useCommonTranslations = () => {
  const { common } = useOptimizedTranslation();
  return common;
};

export const useAuthTranslations = () => {
  const { auth } = useOptimizedTranslation();
  return auth;
};

export const useOnboardingTranslations = () => {
  const { onboarding } = useOptimizedTranslation();
  return onboarding;
};

export const useHomeTranslations = () => {
  const { home } = useOptimizedTranslation();
  return home;
};

export const useLanguageTranslations = () => {
  const { languages } = useOptimizedTranslation();
  return languages;
};

export default useOptimizedTranslation;
