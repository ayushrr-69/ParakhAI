import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastAction {
  label: string;
  onPress: () => void;
}

interface ToastOptions {
  title: string;
  message?: string;
  type?: ToastType;
  duration?: number;
  action?: ToastAction;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
  hideToast: () => void;
  activeToast: ToastOptions | null;
  isOffline: boolean;
  setIsOffline: (offline: boolean) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeToast, setActiveToast] = useState<ToastOptions | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const hideToast = useCallback(() => {
    setActiveToast(null);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const showToast = useCallback((options: ToastOptions) => {
    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const { type = 'info', duration = 3500 } = options;
    
    setActiveToast({ ...options, type, duration });

    if (duration !== Infinity) {
      timerRef.current = setTimeout(() => {
        setActiveToast(null);
      }, duration);
    }
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast, activeToast, isOffline, setIsOffline }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
