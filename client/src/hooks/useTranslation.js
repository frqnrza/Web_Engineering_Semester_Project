// client/src/hooks/useTranslation.js
import { useState, useEffect, useCallback } from 'react';
import translationService from '../services/translationService.js';

/**
 * Custom hook for translation functionality
 */
export function useTranslation(language = 'en') {
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState(null);

  // Translate a key from the dictionary
  const t = useCallback((key, ...params) => {
    if (!key) return '';
    
    let translation = translationService.translateKey(key, language);
    
    // Handle parameters (for dynamic translations like "Hello {name}")
    if (params.length > 0) {
      params.forEach((param, index) => {
        translation = translation.replace(`{${index}}`, param);
      });
    }
    
    return translation;
  }, [language]);

  // Translate dynamic text using API
  const translateText = useCallback(async (text) => {
    if (!text || language === 'en') return text;
    
    setIsTranslating(true);
    setTranslationError(null);
    
    try {
      const translated = await translationService.translateText(text, language);
      return translated;
    } catch (error) {
      console.error('Translation error:', error);
      setTranslationError(error.message);
      return text; // Return original text on error
    } finally {
      setIsTranslating(false);
    }
  }, [language]);

  // Clear translation cache
  const clearCache = useCallback(() => {
    translationService.clearCache();
  }, []);

  // Get translation statistics
  const getStats = useCallback(() => {
    return {
      cacheSize: translationService.cache.size,
      dictionarySize: Object.keys(translationService.getAllTranslations()).length
    };
  }, []);

  return {
    t,
    translateText,
    isTranslating,
    translationError,
    clearCache,
    getStats,
    language
  };
}