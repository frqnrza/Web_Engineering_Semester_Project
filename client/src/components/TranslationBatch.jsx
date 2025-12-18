// client/src/components/TranslationBatch.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../contexts/TranslationContext.jsx';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * Component for batch translating multiple texts
 */
export function TranslationBatch({ 
  texts = [],
  onComplete,
  showProgress = true,
  className = '',
  ...props 
}) {
  const { translateBatch, isTranslating } = useTranslation();
  const [translations, setTranslations] = useState([]);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // 'idle', 'translating', 'complete', 'error'
  const [error, setError] = useState(null);

  useEffect(() => {
    if (texts.length > 0 && status === 'idle') {
      startTranslation();
    }
  }, [texts]);

  const startTranslation = async () => {
    if (texts.length === 0) return;

    setStatus('translating');
    setProgress(0);
    setError(null);

    try {
      // Simulate progress
      const interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const results = await translateBatch(texts);
      
      clearInterval(interval);
      setProgress(100);
      setTranslations(results);
      setStatus('complete');

      if (onComplete) {
        onComplete(results);
      }
    } catch (err) {
      setStatus('error');
      setError(err.message);
      console.error('Batch translation failed:', err);
    }
  };

  const handleRetry = () => {
    setStatus('idle');
    setTranslations([]);
    setTimeout(startTranslation, 100);
  };

  return (
    <div className={`translation-batch ${className}`} {...props}>
      {showProgress && status === 'translating' && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Translating {texts.length} items...</span>
            <span className="text-sm">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {status === 'complete' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <Check className="w-5 h-5 text-green-600 mr-2" />
            <span className="font-medium text-green-800">
              Translation complete! ({translations.length} items)
            </span>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center mb-2">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="font-medium text-red-800">Translation failed</span>
          </div>
          <p className="text-sm text-red-700 mb-3">{error}</p>
          <button
            onClick={handleRetry}
            className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
          >
            Retry Translation
          </button>
        </div>
      )}

      {/* Show translations if needed */}
      {translations.length > 0 && (
        <div className="mt-4 space-y-2 max-h-60 overflow-auto">
          {translations.map((translation, index) => (
            <div key={index} className="p-2 bg-gray-50 rounded border">
              <div className="text-sm font-medium mb-1">Item {index + 1}:</div>
              <div className="text-sm">{translation}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

TranslationBatch.propTypes = {
  texts: PropTypes.array,
  onComplete: PropTypes.func,
  showProgress: PropTypes.bool,
  className: PropTypes.string
};