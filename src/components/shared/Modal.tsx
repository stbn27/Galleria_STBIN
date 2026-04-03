import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';

interface ModalProps {
  name: string;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ name, title, children }) => {
  const { activeModal, closeModal } = useUiStore();
  const isOpen = activeModal === name;

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeModal();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, closeModal]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={closeModal}
      />
      
      {/* Modal Content */}
      <div 
        className="relative bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] w-full max-w-lg mx-4 flex flex-col animate-[modalIn_200ms_ease_both]"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
          <h2 className="text-lg font-['Space_Grotesk'] font-semibold text-[var(--text-primary)]">
            {title}
          </h2>
          <button 
            onClick={closeModal}
            className="p-1 rounded-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
