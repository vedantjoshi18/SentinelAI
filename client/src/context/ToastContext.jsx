import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({
    title,
    description = '',
    type = 'info',
    duration = 4500,
    action = null,
    onAction = null,
  }) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { id, title, description, type, action, onAction };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, toasts }}>
      {children}
      {/* Toast Notification Container */}
      <div
        aria-live="polite"
        className="fixed z-50 pointer-events-none flex flex-col space-y-2.5 
                   top-4 right-4 sm:top-6 sm:right-6 max-w-sm w-full 
                   sm:items-end items-center"
      >
        {toasts.map((toast) => {
          const Icon =
            toast.type === 'success'
              ? CheckCircle2
              : toast.type === 'error'
              ? AlertCircle
              : toast.type === 'warning'
              ? AlertTriangle
              : Info;

          const colorClass =
            toast.type === 'success'
              ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
              : toast.type === 'error'
              ? 'text-rose-500 bg-rose-500/10 border-rose-500/20'
              : toast.type === 'warning'
              ? 'text-amber-500 bg-amber-500/10 border-amber-500/20'
              : 'text-slate-500 bg-slate-500/10 border-slate-500/20 dark:text-slate-400';

          return (
            <div
              key={toast.id}
              className="pointer-events-auto w-full bg-white dark:bg-[#151A24] border border-neutral-200/80 
                         dark:border-white/10 rounded-2xl p-4 shadow-luxury dark:shadow-2xl 
                         flex items-start space-x-3 transition-all duration-300 animate-in fade-in slide-in-from-top-4"
            >
              <div className={`p-1.5 rounded-xl border flex-shrink-0 ${colorClass}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-xs font-semibold text-neutral-900 dark:text-white leading-tight">
                  {toast.title}
                </p>
                {toast.description && (
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                    {toast.description}
                  </p>
                )}
                {toast.action && (
                  <button
                    onClick={() => {
                      if (toast.onAction) toast.onAction();
                      removeToast(toast.id);
                    }}
                    className="mt-2 text-[11px] font-semibold text-neutral-900 dark:text-white underline underline-offset-2 hover:opacity-80 transition"
                  >
                    {toast.action}
                  </button>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white p-1 rounded-lg transition"
                aria-label="Close notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
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
