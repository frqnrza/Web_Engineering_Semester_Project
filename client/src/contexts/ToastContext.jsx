import React, { createContext, useContext, useState } from 'react';
import { Toast } from '../components/Toast.jsx';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = ({ title, description, variant = "default" }) => {
    // Convert shadcn/ui variant to your Toast types
    let type = 'info';
    if (variant === 'destructive') type = 'error';
    else if (variant === 'success') type = 'success';
    else if (variant === 'warning') type = 'warning';
    
    const message = description || title || '';
    const id = Math.random().toString(36).substring(2, 9);
    
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type}
            duration={3000}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}