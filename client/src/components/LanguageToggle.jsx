// client/src/components/LanguageToggle.jsx
import React from 'react';
import { useTranslation } from '../contexts/TranslationContext.jsx';
import { Globe, Languages } from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * Reusable language toggle component
 */
export function LanguageToggle({
  variant = 'default', // 'default', 'minimal', 'full', 'icon'
  showLabel = true,
  className = '',
  ...props
}) {
  const { language, toggleLanguage } = useTranslation();

  const variants = {
    default: (
      <button
        onClick={toggleLanguage}
        className={`inline-flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors ${className}`}
        aria-label={`Switch to ${language === 'en' ? 'Urdu' : 'English'}`}
        {...props}
      >
        <Globe className="w-4 h-4 mr-2" />
        <span className="font-medium">
          {language === 'en' ? 'EN' : 'UR'}
        </span>
        {showLabel && (
          <span className="ml-2 text-sm">
            {language === 'en' ? 'English' : 'اردو'}
          </span>
        )}
      </button>
    ),
    
    minimal: (
      <button
        onClick={toggleLanguage}
        className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 ${className}`}
        aria-label={`Switch to ${language === 'en' ? 'Urdu' : 'English'}`}
        {...props}
      >
        <span className="font-bold text-sm">
          {language === 'en' ? 'EN' : 'UR'}
        </span>
      </button>
    ),
    
    full: (
      <div className={`language-toggle-full ${className}`}>
        <button
          onClick={() => language !== 'en' && toggleLanguage()}
          className={`px-4 py-2 rounded-l-lg font-medium ${
            language === 'en'
              ? 'bg-[#0A2540] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          disabled={language === 'en'}
        >
          English
        </button>
        <button
          onClick={() => language !== 'ur' && toggleLanguage()}
          className={`px-4 py-2 rounded-r-lg font-medium ${
            language === 'ur'
              ? 'bg-[#0A2540] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          disabled={language === 'ur'}
        >
          اردو
        </button>
      </div>
    ),
    
    icon: (
      <button
        onClick={toggleLanguage}
        className={`p-2 rounded-full hover:bg-gray-100 ${className}`}
        aria-label={`Switch to ${language === 'en' ? 'Urdu' : 'English'}`}
        {...props}
      >
        <Languages className="w-5 h-5" />
      </button>
    )
  };

  return variants[variant] || variants.default;
}

LanguageToggle.propTypes = {
  variant: PropTypes.oneOf(['default', 'minimal', 'full', 'icon']),
  showLabel: PropTypes.bool,
  className: PropTypes.string
};