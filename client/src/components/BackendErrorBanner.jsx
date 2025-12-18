import { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, X, Server } from 'lucide-react';
import { Button } from './ui/button';
import { checkBackendAvailability, resetBackendCheck } from '../services/api';

export function BackendErrorBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    checkBackend();
  }, []);

  const checkBackend = async () => {
    setIsChecking(true);
    resetBackendCheck();
    const available = await checkBackendAvailability();
    setIsVisible(!available && !isDismissed);
    setIsChecking(false);
  };

  const handleRetry = () => {
    checkBackend();
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-[72px] left-0 right-0 z-40 bg-amber-50 border-b border-amber-200 shadow-md">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-start gap-4">
          <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-amber-900 mb-1">
              Backend Server Not Available
            </h3>
            <p className="text-sm text-amber-800 mb-3">
              The backend server is not running. Authentication and data features are currently unavailable.
            </p>
            
            <div className="bg-amber-100 rounded-lg p-3 mb-3">
              <p className="text-xs font-mono text-amber-900 mb-2">
                <Server className="inline w-3 h-3 mr-1" />
                To start the backend server:
              </p>
              <div className="space-y-1 text-xs font-mono text-amber-800">
                <div className="bg-amber-200 rounded px-2 py-1">cd server</div>
                <div className="bg-amber-200 rounded px-2 py-1">npm install</div>
                <div className="bg-amber-200 rounded px-2 py-1">npm run dev</div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleRetry}
                disabled={isChecking}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isChecking ? (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry Connection
                  </>
                )}
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={handleDismiss}
                className="border-amber-300 text-amber-900 hover:bg-amber-100"
              >
                Dismiss
              </Button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="text-amber-600 hover:text-amber-800 flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}