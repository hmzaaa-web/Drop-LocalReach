import React, { useEffect } from 'react';
import { Check, AlertCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 3200);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
      <div className="glass-card bg-white/95 px-4 py-3 rounded-[12px] shadow-lg border border-brand-neutral-200/80 flex items-center gap-3 max-w-sm">
        {toast.type === 'success' && (
          <div className="w-5 h-5 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center shrink-0">
            <Check size={13} strokeWidth={3} />
          </div>
        )}
        {toast.type === 'error' && (
          <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <AlertCircle size={13} strokeWidth={3} />
          </div>
        )}
        <span className="text-xs font-medium text-brand-black">{toast.text}</span>
        <button
          onClick={onClose}
          className="text-brand-neutral-500 hover:text-brand-black ml-auto p-1"
          aria-label="Close notification"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
};
