// client/src/services/translationService.js
import { translations } from './translations.js';

// Translation service configuration
const TRANSLATION_CONFIG = {
  // API service settings
  api: {
    endpoint: import.meta.env.VITE_TRANSLATION_API_URL || '/api/translate',
    timeout: 5000, // 5 seconds timeout
    retryAttempts: 2
  },
  
  // Cache settings
  cache: {
    enabled: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    storageKey: 'techconnect_translation_cache',
    maxSize: 1000 // Maximum cached translations
  },
  
  // Fallback strategy
  fallbackStrategy: 'local-first', // 'local-first', 'api-first', 'hybrid'
  
  // Supported languages
  supportedLanguages: ['en', 'ur'],
  
  // Auto-detect source language
  autoDetect: true
};

class TranslationService {
  constructor() {
    this.cache = this.loadCache();
    this.apiKey = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY || 
                  import.meta.env.VITE_MICROSOFT_TRANSLATE_API_KEY;
    this.isOnline = true;
    
    // Initialize cache cleanup
    this.cleanupCache();
  }

  // ========================
  // Core Translation Methods
  // ========================

  /**
   * Translate a key using the dictionary
   */
  translateKey(key, language = 'en') {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    
    const translated = translation[language];
    return translated || translation.en || key;
  }

  /**
   * Translate text using API or local dictionary
   */
  async translateText(text, targetLang = 'ur', sourceLang = 'auto') {
    if (!text || !text.trim()) return text;
    
    // If target language is English or text is empty, return as is
    if (targetLang === 'en') return text;
    
    // Check local dictionary first
    const localTranslation = this.getLocalTranslation(text, targetLang);
    if (localTranslation) return localTranslation;
    
    // Check cache
    const cacheKey = this.generateCacheKey(text, sourceLang, targetLang);
    const cached = this.getCachedTranslation(cacheKey);
    if (cached) return cached;
    
    // Use API for dynamic content
    try {
      const apiTranslation = await this.translateViaAPI(text, targetLang, sourceLang);
      this.cacheTranslation(cacheKey, apiTranslation);
      return apiTranslation;
    } catch (error) {
      console.warn('Translation API failed:', error);
      return text; // Return original text as fallback
    }
  }

  /**
   * Bulk translate multiple texts
   */
  async translateBatch(texts, targetLang = 'ur', sourceLang = 'auto') {
    const results = [];
    
    for (const text of texts) {
      const translation = await this.translateText(text, targetLang, sourceLang);
      results.push(translation);
    }
    
    return results;
  }

  // ========================
  // API Translation Methods
  // ========================

  /**
   * Translate using translation API
   */
  async translateViaAPI(text, targetLang, sourceLang = 'auto') {
    // Check if we have an API key
    if (!this.apiKey && !TRANSLATION_CONFIG.api.endpoint.startsWith('/api')) {
      console.warn('No translation API key available');
      throw new Error('No translation API key');
    }
    
    // For development, use mock API if no endpoint configured
    if (!TRANSLATION_CONFIG.api.endpoint || TRANSLATION_CONFIG.api.endpoint === '/api/translate') {
      return this.mockTranslate(text, targetLang);
    }
    
    try {
      const response = await fetch(TRANSLATION_CONFIG.api.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : undefined
        },
        body: JSON.stringify({
          text,
          target_lang: targetLang,
          source_lang: sourceLang
        }),
        signal: AbortSignal.timeout(TRANSLATION_CONFIG.api.timeout)
      });
      
      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.translated_text || data.text || text;
    } catch (error) {
      console.error('Translation API call failed:', error);
      return this.mockTranslate(text, targetLang);
    }
  }

  /**
   * Mock translation for development
   */
  mockTranslate(text, targetLang) {
    if (targetLang === 'ur') {
      // Simple mock translations for common terms
      const mockTranslations = {
        'home': 'ہوم',
        'about': 'کے بارے میں',
        'contact': 'رابطہ کریں',
        'dashboard': 'ڈیش بورڈ',
        'search': 'تلاش کریں',
        'project': 'پروجیکٹ',
        'company': 'کمپنی',
        'service': 'خدمت',
        'price': 'قیمت',
        'rating': 'درجہ بندی',
        'verified': 'تصدیق شدہ',
        'payment': 'ادائیگی',
        'message': 'پیغام',
        'profile': 'پروفائل',
        'settings': 'ترتیبات',
        'help': 'مدد',
        'support': 'سپورٹ',
        'login': 'لاگ ان',
        'logout': 'لاگ آؤٹ',
        'register': 'رجسٹر کریں',
        'password': 'پاس ورڈ',
        'email': 'ای میل',
        'phone': 'فون',
        'address': 'پتہ',
        'website': 'ویب سائٹ',
        'portfolio': 'پورٹ فولیو',
        'review': 'جائزہ',
        'testimonial': 'شہادت نامہ',
        'category': 'زمرہ',
        'filter': 'فلٹر',
        'sort': 'ترتیب',
        'budget': 'بجٹ',
        'deadline': 'آخری تاریخ',
        'milestone': 'مائل سٹون',
        'delivery': 'ڈلیوری',
        'quality': 'معیار',
        'experience': 'تجربہ',
        'team': 'ٹیم',
        'client': 'کلائنٹ',
        'freelancer': 'فری لانسر',
        'agency': 'ایجنسی',
        'business': 'کاروبار',
        'technology': 'ٹیکنالوجی',
        'development': 'ڈیولپمنٹ',
        'design': 'ڈیزائن',
        'marketing': 'مارکیٹنگ',
        'consultation': 'مشاورت'
      };
      
      // Check if the text matches any mock translation
      const lowerText = text.toLowerCase();
      for (const [key, value] of Object.entries(mockTranslations)) {
        if (lowerText.includes(key)) {
          return value;
        }
      }
      
      // For longer text, return a placeholder
      return text.length > 20 ? `[اردو ترجمہ: ${text.substring(0, 30)}...]` : `[اردو: ${text}]`;
    }
    
    return text;
  }

  // ========================
  // Local Dictionary Methods
  // ========================

  /**
   * Get translation from local dictionary
   */
  getLocalTranslation(text, targetLang) {
    // First check exact match in dictionary
    for (const [key, translation] of Object.entries(translations)) {
      if (translation.en === text && translation[targetLang]) {
        return translation[targetLang];
      }
    }
    
    // Check for partial matches (useful for longer text)
    const words = text.toLowerCase().split(' ');
    for (const [key, translation] of Object.entries(translations)) {
      const english = translation.en.toLowerCase();
      if (words.some(word => english.includes(word)) && translation[targetLang]) {
        return translation[targetLang];
      }
    }
    
    return null;
  }

  /**
   * Add a custom translation to the dictionary
   */
  addCustomTranslation(key, enText, urText) {
    if (!translations[key]) {
      translations[key] = { en: enText, ur: urText };
      
      // Optionally save to localStorage for persistence
      this.saveCustomTranslations();
      return true;
    }
    return false;
  }

  // ========================
  // Caching Methods
  // ========================

  loadCache() {
    if (!TRANSLATION_CONFIG.cache.enabled) return new Map();
    
    try {
      const cached = localStorage.getItem(TRANSLATION_CONFIG.cache.storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        const cacheMap = new Map();
        
        Object.entries(parsed).forEach(([key, value]) => {
          if (Date.now() - value.timestamp < TRANSLATION_CONFIG.cache.maxAge) {
            cacheMap.set(key, value);
          }
        });
        
        return cacheMap;
      }
    } catch (error) {
      console.error('Failed to load translation cache:', error);
    }
    
    return new Map();
  }

  saveCache() {
    if (!TRANSLATION_CONFIG.cache.enabled) return;
    
    try {
      const cacheObject = {};
      this.cache.forEach((value, key) => {
        cacheObject[key] = value;
      });
      
      localStorage.setItem(
        TRANSLATION_CONFIG.cache.storageKey, 
        JSON.stringify(cacheObject)
      );
    } catch (error) {
      console.error('Failed to save translation cache:', error);
    }
  }

  generateCacheKey(text, sourceLang, targetLang) {
    return `${sourceLang}:${targetLang}:${text.trim().toLowerCase()}`;
  }

  getCachedTranslation(key) {
    if (!TRANSLATION_CONFIG.cache.enabled) return null;
    
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < TRANSLATION_CONFIG.cache.maxAge) {
      return cached.translation;
    }
    
    // Remove expired entry
    if (cached) {
      this.cache.delete(key);
    }
    
    return null;
  }

  cacheTranslation(key, translation) {
    if (!TRANSLATION_CONFIG.cache.enabled || this.cache.size >= TRANSLATION_CONFIG.cache.maxSize) {
      return;
    }
    
    this.cache.set(key, {
      translation,
      timestamp: Date.now()
    });
    
    // Save to localStorage periodically
    if (this.cache.size % 10 === 0) {
      this.saveCache();
    }
  }

  cleanupCache() {
    if (!TRANSLATION_CONFIG.cache.enabled) return;
    
    const now = Date.now();
    let needsSave = false;
    
    this.cache.forEach((value, key) => {
      if (now - value.timestamp > TRANSLATION_CONFIG.cache.maxAge) {
        this.cache.delete(key);
        needsSave = true;
      }
    });
    
    if (needsSave) {
      this.saveCache();
    }
  }

  clearCache() {
    this.cache.clear();
    localStorage.removeItem(TRANSLATION_CONFIG.cache.storageKey);
  }

  // ========================
  // Utility Methods
  // ========================

  saveCustomTranslations() {
    try {
      localStorage.setItem('techconnect_custom_translations', JSON.stringify(translations));
    } catch (error) {
      console.error('Failed to save custom translations:', error);
    }
  }

  loadCustomTranslations() {
    try {
      const custom = localStorage.getItem('techconnect_custom_translations');
      if (custom) {
        const parsed = JSON.parse(custom);
        Object.assign(translations, parsed);
      }
    } catch (error) {
      console.error('Failed to load custom translations:', error);
    }
  }

  /**
   * Get all translations for a language
   */
  getAllTranslations(language = 'en') {
    const result = {};
    
    Object.entries(translations).forEach(([key, value]) => {
      result[key] = value[language] || value.en || key;
    });
    
    return result;
  }

  /**
   * Export translations for backup
   */
  exportTranslations() {
    return JSON.stringify(translations, null, 2);
  }

  /**
   * Import translations
   */
  importTranslations(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      Object.assign(translations, imported);
      this.saveCustomTranslations();
      return true;
    } catch (error) {
      console.error('Failed to import translations:', error);
      return false;
    }
  }

  // ========================
  // Language Detection
  // ========================

  detectLanguage(text) {
    // Simple language detection based on character ranges
    const urduRegex = /[\u0600-\u06FF]/;
    const englishRegex = /^[A-Za-z0-9\s.,!?'"-]+$/;
    
    if (urduRegex.test(text)) {
      return 'ur';
    } else if (englishRegex.test(text)) {
      return 'en';
    }
    
    return 'unknown';
  }

  /**
   * Check if text needs translation
   */
  needsTranslation(text, currentLang) {
    if (!text || currentLang === 'en') return false;
    
    const detected = this.detectLanguage(text);
    return detected !== currentLang;
  }
}

// Create singleton instance
const translationService = new TranslationService();

// Export the service
export default translationService;