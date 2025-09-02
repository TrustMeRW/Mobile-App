import { SupportedLanguage } from '@/contexts/TranslationContext';

// Import language files
import en from '@/messages/en.json';
import rw from '@/messages/rw.json';
import fr from '@/messages/fr.json';

// Language messages mapping
export const LANGUAGE_MESSAGES: Record<SupportedLanguage, any> = {
  en,
  rw,
  fr,
};

// Cache for parsed translation keys to improve performance
const translationCache = new Map<string, string>();

/**
 * Get translation value from nested object using dot notation
 * @param messages - The language messages object
 * @param key - The translation key (e.g., 'auth.login.title')
 * @returns The translation value or the key if not found
 */
export const getTranslationValue = (messages: any, key: string): string => {
  // Check cache first
  if (translationCache.has(key)) {
    const cachedValue = translationCache.get(key)!;
    return cachedValue;
  }

  try {
    // Split the key by dots to navigate nested objects
    const keyParts = key.split('.');
    let translation = messages;
    
    // Navigate through the nested object structure
    for (const part of keyParts) {
      if (translation && typeof translation === 'object' && part in translation) {
        translation = translation[part];
      } else {
        // Key not found, return the key as fallback
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }
    
    // Ensure we have a string
    if (typeof translation !== 'string') {
      return key;
    }
    
    // Cache the result
    translationCache.set(key, translation);
    return translation;
  } catch (error) {
    console.error(`Error in translation for key: ${key}`, error);
    return key; // Return key if translation fails
  }
};

/**
 * Handle pluralization for different languages
 * @param text - The text with pluralization markers
 * @param count - The count value
 * @param language - The current language
 * @returns The text with proper pluralization
 */
const handlePluralization = (text: string, count: number, language: SupportedLanguage): string => {
  // Handle English pluralization
  if (language === 'en') {
    return text.replace(/\{\{count, plural, one \{ ([^}]+) \} other \{([^}]+)\}\}/g, (match, one, other) => {
      return count === 1 ? one.trim() : other.trim();
    });
  }
  
  // Handle French pluralization
  if (language === 'fr') {
    return text.replace(/\{\{count, plural, one \{ ([^}]+) \} other \{([^}]+)\}\}/g, (match, one, other) => {
      return count === 1 ? one.trim() : other.trim();
    });
  }
  
  // Handle Kinyarwanda pluralization (simplified - can be expanded)
  if (language === 'rw') {
    return text.replace(/\{\{count, plural, one \{ ([^}]+) \} other \{([^}]+)\}\}/g, (match, one, other) => {
      return count === 1 ? one.trim() : other.trim();
    });
  }
  
  return text;
};

/**
 * Interpolate parameters in translation string
 * @param translation - The translation string
 * @param params - Parameters to interpolate
 * @param language - The current language for pluralization
 * @returns The interpolated string
 */
export const interpolateParams = (
  translation: string, 
  params: Record<string, string | number>,
  language: SupportedLanguage = 'en'
): string => {
  try {
    let result = translation;
    
    // Handle pluralization first
    if (params.count !== undefined) {
      result = handlePluralization(result, Number(params.count), language);
    }
    
    // Then handle other parameters
    Object.entries(params).forEach(([paramKey, paramValue]) => {
      const placeholder = `{{${paramKey}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(paramValue));
    });
    
    return result;
  } catch (error) {
    console.error('Error interpolating parameters:', error);
    return translation;
  }
};

/**
 * Clear translation cache (useful for testing or memory management)
 */
export const clearTranslationCache = () => {
  const cacheSize = translationCache.size;
  translationCache.clear();
};

/**
 * Get all available translation keys for a given language
 * @param language - The language code
 * @returns Array of all available translation keys
 */
export const getAllTranslationKeys = (language: SupportedLanguage): string[] => {
  const messages = LANGUAGE_MESSAGES[language];
  const keys: string[] = [];
  
  const extractKeys = (obj: any, prefix: string = '') => {
    for (const [key, value] of Object.entries(obj)) {
      const currentKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'string') {
        keys.push(currentKey);
      } else if (typeof value === 'object' && value !== null) {
        extractKeys(value, currentKey);
      }
    }
  };
  
  extractKeys(messages);
  return keys;
};

/**
 * Validate translation files for missing keys
 * @param baseLanguage - The base language to compare against (default: 'en')
 * @returns Object with missing keys for each language
 */
export const validateTranslations = (baseLanguage: SupportedLanguage = 'en') => {
  const baseKeys = getAllTranslationKeys(baseLanguage);
  const missingKeys: Record<SupportedLanguage, string[]> = {
    en: [],
    rw: [],
    fr: [],
  };
  
  Object.keys(LANGUAGE_MESSAGES).forEach((lang) => {
    if (lang !== baseLanguage) {
      const langKeys = getAllTranslationKeys(lang as SupportedLanguage);
      missingKeys[lang as SupportedLanguage] = baseKeys.filter(
        key => !langKeys.includes(key)
      );
    }
  });
  
  return missingKeys;
};
