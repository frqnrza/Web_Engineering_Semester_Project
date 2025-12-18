// client/src/contexts/TranslationContext.jsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import translationService from '../services/translationService.js';

const TranslationContext = createContext();

export function TranslationProvider({ children, defaultLanguage = 'en' }) {
  const [language, setLanguage] = useState(defaultLanguage);
  const [isTranslating, setIsTranslating] = useState(false);
  const [cacheStats, setCacheStats] = useState({ size: 0, hits: 0, misses: 0 });

  // Load language preference from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('techconnect_language');
    if (savedLanguage && ['en', 'ur'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Save language preference to localStorage
  useEffect(() => {
    localStorage.setItem('techconnect_language', language);
    
    // Update document direction for RTL languages
    if (language === 'ur') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ur';
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'en';
    }
  }, [language]);

  // Translate a key
  const t = useCallback((key, params = {}) => {
    if (!key) return '';
    
    let translation = translationService.translateKey(key, language);
    
    // Replace parameters in translation
    Object.entries(params).forEach(([param, value]) => {
      translation = translation.replace(`{${param}}`, value);
    });
    
    return translation;
  }, [language]);

  // Translate dynamic text
  const translateDynamic = useCallback(async (text) => {
    if (!text || language === 'en') return text;
    
    setIsTranslating(true);
    try {
      const translated = await translationService.translateText(text, language);
      return translated;
    } catch (error) {
      console.error('Dynamic translation failed:', error);
      return text;
    } finally {
      setIsTranslating(false);
    }
  }, [language]);

  // Batch translate
  const translateBatch = useCallback(async (texts) => {
    if (language === 'en') return texts;
    
    setIsTranslating(true);
    try {
      const translated = await translationService.translateBatch(texts, language);
      return translated;
    } catch (error) {
      console.error('Batch translation failed:', error);
      return texts;
    } finally {
      setIsTranslating(false);
    }
  }, [language]);

  // Change language
  const changeLanguage = useCallback((newLanguage) => {
    if (['en', 'ur'].includes(newLanguage)) {
      setLanguage(newLanguage);
      return true;
    }
    return false;
  }, []);

  // Toggle between English and Urdu
  const toggleLanguage = useCallback(() => {
    setLanguage(prev => prev === 'en' ? 'ur' : 'en');
  }, []);

  // Clear translation cache
  const clearCache = useCallback(() => {
    translationService.clearCache();
    updateCacheStats();
  }, []);

  // Update cache statistics
  const updateCacheStats = useCallback(() => {
    const stats = translationService.getStats ? translationService.getStats() : { cacheSize: 0 };
    setCacheStats(prev => ({
      ...prev,
      size: stats.cacheSize || 0
    }));
  }, []);

  // Update stats periodically
  useEffect(() => {
    updateCacheStats();
    const interval = setInterval(updateCacheStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [updateCacheStats]);

  // Add custom translation
  const addTranslation = useCallback((key, enText, urText) => {
    const success = translationService.addCustomTranslation(key, enText, urText);
    if (success) {
      console.log(`Added custom translation: ${key}`);
    }
    return success;
  }, []);

  const value = {
    language,
    setLanguage: changeLanguage,
    toggleLanguage,
    t,
    translateDynamic,
    translateBatch,
    isTranslating,
    clearCache,
    cacheStats,
    addTranslation,
    getAllTranslations: () => translationService.getAllTranslations(language)
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

// Custom hook to use translation context
export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}

// Higher-order component for translation
export function withTranslation(Component) {
  return function WrappedComponent(props) {
    const translation = useTranslation();
    return <Component {...props} translation={translation} />;
  };
}