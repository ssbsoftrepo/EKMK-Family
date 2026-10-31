import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (title: string, message?: string, duration?: number) => void;
    error: (title: string, message?: string, duration?: number) => void;
    warning: (title: string, message?: string, duration?: number) => void;
    info: (title: string, message?: string, duration?: number) => void;
  };
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, title: string, message?: string, duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastItem = { id, type, title, message, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = {
    success: useCallback((title: string, message?: string, duration?: number) => {
      addToast('success', title, message, duration);
    }, [addToast]),
    error: useCallback((title: string, message?: string, duration?: number) => {
      addToast('error', title, message, duration);
    }, [addToast]),
    warning: useCallback((title: string, message?: string, duration?: number) => {
      addToast('warning', title, message, duration);
    }, [addToast]),
    info: useCallback((title: string, message?: string, duration?: number) => {
      addToast('info', title, message, duration);
    }, [addToast]),
  };

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}

      {/* Floating Theme-Related Toast Stack */}
      <div
        aria-live="polite"
        className="fixed top-5 right-5 z-[10000] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';
          const isInfo = t.type === 'info';

          return (
            <div
              key={t.id}
              className={`pointer-events-auto rounded-[18px] border-[3px] bg-white text-album-leaf font-album shadow-[0_8px_24px_rgb(var(--c-leaf)/0.22)] p-3.5 flex items-start gap-3 transition-all duration-300 animate-slideDown ${
                isSuccess
                  ? 'border-album-moss'
                  : isError
                  ? 'border-album-terracotta'
                  : isWarning
                  ? 'border-album-turmeric'
                  : 'border-album-leaf'
              }`}
            >
              {/* Theme Icon Badge */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isSuccess
                    ? 'bg-album-sage text-album-leaf'
                    : isError
                    ? 'bg-album-blush text-album-terracotta'
                    : isWarning
                    ? 'bg-album-sun text-album-leaf'
                    : 'bg-album-paper text-album-leaf'
                }`}
              >
                {isSuccess && <CheckCircle2 className="w-4 h-4" />}
                {isError && <AlertCircle className="w-4 h-4" />}
                {isWarning && <AlertTriangle className="w-4 h-4" />}
                {isInfo && <Info className="w-4 h-4" />}
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0 pr-1">
                <p className="font-album text-base font-extrabold leading-snug">
                  {t.title}
                </p>
                {t.message && (
                  <p className="font-album text-[15px] leading-snug mt-0.5 break-words">
                    {t.message}
                  </p>
                )}
              </div>

              {/* Dismiss button */}
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="text-album-leaf w-10 h-10 -m-1 rounded-full hover:bg-album-paper flex items-center justify-center cursor-pointer flex-shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
};
