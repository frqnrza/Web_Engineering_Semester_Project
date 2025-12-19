import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast } from '../Toast'; // Import your existing visual component

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // The function to trigger a new toast
  const toast = useCallback(({ title, description, variant = "default", duration = 3000 }) => {
    const id = Math.random().toString(36).substr(2, 9);
    
    // Map Shadcn 'variant' to your Toast 'type'
    let type = 'info';
    if (variant === 'destructive') type = 'error';
    if (variant === 'success') type = 'success';
    if (variant === 'warning') type = 'warning';

    // If title/description are passed (Shadcn style), map to 'message'
    const message = description || title;

    setToasts((prev) => [...prev, { id, message, type, duration }]);

    // Auto remove logic is handled inside your Toast component via useEffect, 
    // but we also need to remove it from state here to keep the array clean.
    setTimeout(() => {
      removeToast(id);
    }, duration + 300); // Small buffer for animation
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Container for the toasts */}
      <div className="fixed top-0 right-0 z-50 p-4 flex flex-col gap-2">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type}
            duration={t.duration}
            onClose={() => removeToast(t.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// THE HOOK YOUR OTHER FILE WANTS
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}