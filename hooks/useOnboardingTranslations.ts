import { useTranslation } from '@/contexts/TranslationContext';

export const useOnboardingTranslations = () => {
  const { t } = useTranslation();

  return {
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
  };
};
