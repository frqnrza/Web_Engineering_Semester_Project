// client/src/components/TranslationDebugPanel.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../contexts/TranslationContext.jsx';
import { Settings, Database, RefreshCw, Trash2, Eye, EyeOff } from 'lucide-react';

/**
 * Development tool for debugging translations
 * Only shown in development mode
 */
export function TranslationDebugPanel() {
  const { clearCache, cacheStats, getAllTranslations, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [translationStats, setTranslationStats] = useState({});
  const [showAllTranslations, setShowAllTranslations] = useState(false);

  useEffect(() => {
    // Only show in development
    if (import.meta.env.DEV) {
      updateStats();
    }
  }, []);

  const updateStats = () => {
    const translations = getAllTranslations();
    setTranslationStats({
      totalKeys: Object.keys(translations).length,
      englishWords: Object.values(translations).filter(v => typeof v === 'string').length,
      sampleTranslations: Object.entries(translations).slice(0, 5)
    });
  };

  const handleClearCache = () => {
    clearCache();
    alert('Translation cache cleared!');
    updateStats();
  };

  const handleTestTranslation = async () => {
    const testText = 'Hello, welcome to TechConnect!';
    alert(`Test translation would be: ${t('welcomeMessage')}`);
  };

  if (!import.meta.env.DEV) {
    return null; // Hide in production
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700"
          aria-label="Open Translation Debug Panel"
        >
          <Settings className="w-6 h-6" />
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-xl w-80 max-h-96 overflow-auto">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center">
                <Database className="w-5 h-5 mr-2" />
                Translation Debug
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Cache Stats */}
            <div className="bg-gray-50 p-3 rounded">
              <h4 className="font-medium mb-2">Cache Statistics</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Cache Size:</span>
                  <span className="font-mono">{cacheStats.size || 0} entries</span>
                </div>
                <div className="flex justify-between">
                  <span>Dictionary Size:</span>
                  <span className="font-mono">{translationStats.totalKeys || 0} keys</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={handleClearCache}
                className="w-full flex items-center justify-center px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Translation Cache
              </button>
              
              <button
                onClick={handleTestTranslation}
                className="w-full flex items-center justify-center px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Test Translation
              </button>
              
              <button
                onClick={() => setShowAllTranslations(!showAllTranslations)}
                className="w-full flex items-center justify-center px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                {showAllTranslations ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Hide All Translations
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Show All Translations
                  </>
                )}
              </button>
            </div>

            {/* Sample Translations */}
            {showAllTranslations && (
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="font-medium mb-2">Sample Translations</h4>
                <div className="space-y-2 text-sm">
                  {translationStats.sampleTranslations?.map(([key, translation]) => (
                    <div key={key} className="border-l-2 border-blue-500 pl-2">
                      <div className="font-mono text-xs text-gray-500">{key}</div>
                      <div>{translation}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Environment Info */}
            <div className="text-xs text-gray-500">
              <div>API Key: {import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY ? '✓ Set' : '✗ Not set'}</div>
              <div>API URL: {import.meta.env.VITE_TRANSLATION_API_URL || 'Not set'}</div>
              <div>Mode: {import.meta.env.PROD ? 'Production' : 'Development'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}