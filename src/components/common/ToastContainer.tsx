import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />,
          info: <Info className="w-5 h-5 text-primary-500 flex-shrink-0" />,
        };

        const bgBorders = {
          success: 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/80',
          error: 'border-rose-200 dark:border-rose-800/50 bg-rose-50 dark:bg-rose-950/80',
          warning: 'border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/80',
          info: 'border-primary-200 dark:border-primary-800/50 bg-primary-50 dark:bg-primary-950/80',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start space-x-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-md transition-all animate-slide-in ${bgBorders[toast.type]}`}
          >
            {icons[toast.type]}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                {toast.title}
              </h4>
              {toast.message && (
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                  {toast.message}
                </p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

