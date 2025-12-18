// client/src/components/TranslationWrapper.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../contexts/TranslationContext.jsx';
import { Loader2 } from 'lucide-react';

/**
 * Component that automatically translates its children
 * Can be used for dynamic content translation
 */
export function TranslationWrapper({ 
  children, 
  text, 
  autoTranslate = true, 
  showLoader = true,
  className = '',
  ...props 
}) {
  const { translateDynamic, isTranslating, language } = useTranslation();
  const [translatedText, setTranslatedText] = useState(text || children);
  const [originalText, setOriginalText] = useState(text || children);
  const [isLocalTranslating, setIsLocalTranslating] = useState(false);

  useEffect(() => {
    setOriginalText(text || children);
  }, [text, children]);

  useEffect(() => {
    const translateContent = async () => {
      if (!autoTranslate || language === 'en' || !originalText) {
        setTranslatedText(originalText);
        return;
      }

      setIsLocalTranslating(true);
      try {
        const result = await translateDynamic(originalText);
        setTranslatedText(result);
      } catch (error) {
        console.error('Translation failed:', error);
        setTranslatedText(originalText);
      } finally {
        setIsLocalTranslating(false);
      }
    };

    translateContent();
  }, [originalText, language, autoTranslate, translateDynamic]);

  const isLoading = isTranslating || isLocalTranslating;

  // If we have text prop, render that
  if (text !== undefined) {
    return (
      <span className={className} {...props}>
        {isLoading && showLoader ? (
          <span className="inline-flex items-center text-gray-400">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Translating...
          </span>
        ) : (
          translatedText
        )}
      </span>
    );
  }

  // If we have children as a React element
  if (React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      className: `${children.props.className || ''} ${className}`,
      children: isLoading && showLoader ? (
        <span className="inline-flex items-center text-gray-400">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Translating...
        </span>
      ) : (
        translatedText
      )
    });
  }

  // Default render for string children
  return (
    <span className={className} {...props}>
      {isLoading && showLoader ? (
        <span className="inline-flex items-center text-gray-400">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Translating...
        </span>
      ) : (
        children
      )}
    </span>
  );
}