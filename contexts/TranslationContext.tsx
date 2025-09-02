import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  LANGUAGE_MESSAGES, 
  getTranslationValue, 
  interpolateParams,
  clearTranslationCache
} from '@/utils/translation';

// Define supported languages
export type SupportedLanguage = 'en' | 'rw' | 'fr';

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

// Language configuration
export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageInfo> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
  },
  rw: {
    code: 'rw',
    name: 'Kinyarwanda',
    nativeName: 'Kinyarwanda',
    flag: '🇷🇼',
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
  },
};

interface TranslationContextType {
  currentLanguage: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
  getSupportedLanguages: () => LanguageInfo[];
  isLoading: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};

interface TranslationProviderProps {
  children: React.ReactNode;
}

const LANGUAGE_STORAGE_KEY = 'selected_language';

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  const [isLoading, setIsLoading] = useState(true);
  const [languageVersion, setLanguageVersion] = useState(0); // Force re-renders when language changes

  // Memoize the current language messages to prevent unnecessary re-renders
  const currentMessages = useMemo(() => {
    return LANGUAGE_MESSAGES[currentLanguage] || LANGUAGE_MESSAGES.en;
  }, [currentLanguage]);

  // Load saved language on mount
  useEffect(() => {
    loadSavedLanguage();
  }, []);

  // Load saved language from storage
  const loadSavedLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage && SUPPORTED_LANGUAGES[savedLanguage as SupportedLanguage]) {
        const language = savedLanguage as SupportedLanguage;
        setCurrentLanguage(language);
      }
    } catch (error) {
      console.error('Error loading saved language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Set new language
  const setLanguage = async (language: SupportedLanguage) => {
    try {
      
      // Clear translation cache to ensure fresh translations
      clearTranslationCache();
      
      // Update state
      setCurrentLanguage(language);
      
      // Increment language version to force re-renders
      setLanguageVersion(prev => {
        const newVersion = prev + 1;
        return newVersion;
      });
      
      // Save to storage
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (error) {
      console.error('Error setting language:', error);
    }
  };

  // Memoized translation function to prevent unnecessary re-renders
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    try {
      
      // Get translation value using utility function
      const translation = getTranslationValue(currentMessages, key);
      
      // Handle interpolation if params are provided
      if (params) {
        const interpolated = interpolateParams(translation, params, currentLanguage);
        return interpolated;
      }
      return translation;
    } catch (error) {
      return key; // Return key if translation fails
    }
  }, [currentMessages, currentLanguage, languageVersion]); // Include languageVersion to force updates

  // Memoize supported languages to prevent unnecessary re-renders
  const getSupportedLanguages = useCallback((): LanguageInfo[] => {
    return Object.values(SUPPORTED_LANGUAGES);
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    currentLanguage,
    setLanguage,
    t,
    getSupportedLanguages,
    isLoading,
  }), [currentLanguage, setLanguage, t, getSupportedLanguages, isLoading]);

  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
    </TranslationContext.Provider>
  );
};
