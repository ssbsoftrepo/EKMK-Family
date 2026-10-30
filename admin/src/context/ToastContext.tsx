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
              className={`pointer-events-auto rounded-2xl border-2 shadow-heritage-lg p-3.5 flex items-start gap-3 backdrop-blur-md transition-all duration-300 animate-slideDown ${
                isSuccess
                  ? 'border-emerald-600/50 bg-[#FFFEFB] text-emerald-950 ring-1 ring-emerald-500/20'
                  : isError
                  ? 'border-rose-600/50 bg-[#FFFEFB] text-rose-950 ring-1 ring-rose-500/20'
                  : isWarning
                  ? 'border-heritage-gold bg-[#FFFEFB] text-heritage-charcoal ring-1 ring-heritage-gold/30'
                  : 'border-blue-600/50 bg-[#FFFEFB] text-blue-950 ring-1 ring-blue-500/20'
              }`}
            >
              {/* Theme Icon Badge */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                  isSuccess
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : isError
                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                    : isWarning
                    ? 'bg-heritage-gold-100 text-heritage-gold-800 border border-heritage-gold-300'
                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                }`}
              >
                {isSuccess && <CheckCircle2 className="w-4 h-4" />}
                {isError && <AlertCircle className="w-4 h-4" />}
                {isWarning && <AlertTriangle className="w-4 h-4" />}
                {isInfo && <Info className="w-4 h-4" />}
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0 pr-1">
                <p className="font-serif text-xs font-bold tracking-tight text-heritage-charcoal">
                  {t.title}
                </p>
                {t.message && (
                  <p className="text-[11px] text-heritage-muted leading-relaxed mt-0.5 break-words">
                    {t.message}
                  </p>
                )}
              </div>

              {/* Dismiss button */}
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="text-heritage-muted hover:text-heritage-charcoal p-1 rounded-lg hover:bg-black/5 transition-colors cursor-pointer flex-shrink-0"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
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
