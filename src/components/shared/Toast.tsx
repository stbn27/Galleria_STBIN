import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), 5000);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  const Icon = type === 'success' ? CheckCircle : type === 'error' ? AlertCircle : Info;
  const colorClass = type === 'success' ? 'text-[var(--success)]' : type === 'error' ? 'text-[var(--danger)]' : 'text-[var(--info)]';

  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] p-3 flex items-start gap-3 min-w-[300px] max-w-sm pointer-events-auto animate-[fadeUp_200ms_ease_both]">
      <Icon size={18} className={`shrink-0 mt-0.5 ${colorClass}`} />
      <p className="flex-1 text-sm text-[var(--text-primary)]">{message}</p>
      <button 
        onClick={() => onClose(id)}
        className="shrink-0 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-0.5"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
