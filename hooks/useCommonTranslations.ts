import { useTranslation } from '@/contexts/TranslationContext';

export const useCommonTranslations = () => {
  const { t } = useTranslation();

  return {
    welcome: t('common.welcome'),
    next: t('common.next'),
    previous: t('common.previous'),
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
    ok: t('common.ok'),
    close: t('common.close'),
  };
};
