// client/src/components/DynamicTranslation.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../contexts/TranslationContext.jsx';
import { Loader2, Globe, Check, X } from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * Component for dynamic text translation with advanced features
 */
export function DynamicTranslation({ 
  text, 
  showOriginal = false,
  showTranslationSource = false,
  editable = false,
  onTranslationUpdate,
  className = '',
  ...props 
}) {
  const { translateDynamic, isTranslating, language, addTranslation } = useTranslation();
  const [translated, setTranslated] = useState(text);
  const [isLocalTranslating, setIsLocalTranslating] = useState(false);
  const [translationSource, setTranslationSource] = useState('pending');
  const [isEditing, setIsEditing] = useState(false);
  const [editedTranslation, setEditedTranslation] = useState('');

  useEffect(() => {
    const updateTranslation = async () => {
      if (!text) {
        setTranslated('');
        return;
      }

      if (language === 'en') {
        setTranslated(text);
        setTranslationSource('original');
        return;
      }

      setIsLocalTranslating(true);
      try {
        const result = await translateDynamic(text);
        setTranslated(result);
        
        // Detect if it's a mock translation
        if (result.includes('[اردو:') || result.includes('[اردو ترجمہ:')) {
          setTranslationSource('mock');
        } else {
          setTranslationSource('api');
        }
      } catch (error) {
        console.error('Translation failed:', error);
        setTranslated(text);
        setTranslationSource('error');
      } finally {
        setIsLocalTranslating(false);
      }
    };

    updateTranslation();
  }, [text, language, translateDynamic]);

  const handleEditTranslation = () => {
    setIsEditing(true);
    setEditedTranslation(translated);
  };

  const handleSaveTranslation = () => {
    setTranslated(editedTranslation);
    setIsEditing(false);
    
    if (onTranslationUpdate) {
      onTranslationUpdate(editedTranslation);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedTranslation('');
  };

  const handleAddToDictionary = () => {
    const key = `custom_${Date.now()}`;
    const success = addTranslation(key, text, translated);
    
    if (success) {
      alert('Translation added to dictionary!');
    }
  };

  const isLoading = isTranslating || isLocalTranslating;
  const showTranslationControls = editable && translationSource === 'mock';

  return (
    <div className={`dynamic-translation ${className}`} {...props}>
      {isLoading ? (
        <div className="flex items-center space-x-2 text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Translating...</span>
        </div>
      ) : isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editedTranslation}
            onChange={(e) => setEditedTranslation(e.target.value)}
            className="w-full p-2 border rounded"
            rows="3"
          />
          <div className="flex space-x-2">
            <button
              onClick={handleSaveTranslation}
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              <Check className="w-4 h-4 inline mr-1" />
              Save
            </button>
            <button
              onClick={handleCancelEdit}
              className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
            >
              <X className="w-4 h-4 inline mr-1" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="translated-content">
            {translated}
          </div>
          
          {showOriginal && language !== 'en' && text && (
            <div className="mt-1 text-xs text-gray-500 italic">
              Original: {text}
            </div>
          )}
          
          {showTranslationSource && (
            <div className="mt-1 text-xs">
              <span className={`inline-flex items-center px-2 py-1 rounded ${
                translationSource === 'api' 
                  ? 'bg-green-100 text-green-800' 
                  : translationSource === 'mock'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <Globe className="w-3 h-3 mr-1" />
                {translationSource === 'api' && 'Google Translate'}
                {translationSource === 'mock' && 'Mock Translation'}
                {translationSource === 'original' && 'Original Text'}
                {translationSource === 'error' && 'Translation Error'}
                {translationSource === 'pending' && 'Pending'}
              </span>
            </div>
          )}
          
          {showTranslationControls && (
            <div className="mt-2 flex space-x-2">
              <button
                onClick={handleEditTranslation}
                className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                Edit Translation
              </button>
              <button
                onClick={handleAddToDictionary}
                className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
              >
                Save to Dictionary
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

DynamicTranslation.propTypes = {
  text: PropTypes.string.isRequired,
  showOriginal: PropTypes.bool,
  showTranslationSource: PropTypes.bool,
  editable: PropTypes.bool,
  onTranslationUpdate: PropTypes.func,
  className: PropTypes.string
};