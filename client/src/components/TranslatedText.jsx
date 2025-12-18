// client/src/components/TranslatedText.jsx
import React from 'react';
import { useTranslation } from '../contexts/TranslationContext.jsx';
import PropTypes from 'prop-types';

/**
 * Component for displaying translated text from dictionary keys
 * Uses the translation dictionary for static content
 */
export function TranslatedText({ 
  textKey, 
  params = {}, 
  defaultText = '',
  className = '',
  tag: Tag = 'span',
  ...props 
}) {
  const { t } = useTranslation();
  
  let translated = t(textKey, params);
  
  // If translation returns the key itself (not found), use default text
  if (translated === textKey && defaultText) {
    translated = defaultText;
  }
  
  return (
    <Tag className={className} {...props}>
      {translated}
    </Tag>
  );
}

TranslatedText.propTypes = {
  textKey: PropTypes.string.isRequired,
  params: PropTypes.object,
  defaultText: PropTypes.string,
  className: PropTypes.string,
  tag: PropTypes.string
};

/**
 * Component for plural translations
 */
export function TranslatedPlural({ 
  textKey, 
  count, 
  params = {},
  className = '',
  tag: Tag = 'span',
  ...props 
}) {
  const { t } = useTranslation();
  
  // Handle pluralization
  const pluralKey = count === 1 ? `${textKey}_singular` : `${textKey}_plural`;
  const translation = t(pluralKey, { count, ...params });
  
  // Fallback to singular if plural not found
  const finalText = translation === pluralKey ? t(textKey, { count, ...params }) : translation;
  
  return (
    <Tag className={className} {...props}>
      {finalText}
    </Tag>
  );
}

TranslatedPlural.propTypes = {
  textKey: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  params: PropTypes.object,
  className: PropTypes.string,
  tag: PropTypes.string
};