import React from 'react';
import { AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'យល់ព្រម',
  cancelLabel = 'បោះបង់',
  variant = 'danger',
  isLoading = false
}) => {
  const icons = {
    danger: <AlertCircle className="w-10 h-10 text-rose-500 mb-2 mx-auto" />,
    warning: <AlertTriangle className="w-10 h-10 text-amber-500 mb-2 mx-auto" />,
    primary: <HelpCircle className="w-10 h-10 text-primary-500 mb-2 mx-auto" />,
  };

  const confirmColors = {
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20',
    primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/20',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="text-center py-2">
        {icons[variant]}
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
          {message}
        </p>

        <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
            }}
            disabled={isLoading}
            className={`px-4 py-2 text-xs font-semibold rounded-xl shadow-md transition-all ${confirmColors[variant]}`}
          >
            {isLoading ? 'កំពុងដំណើរការ...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};

