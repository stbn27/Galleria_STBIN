import React from 'react';
import { X } from 'lucide-react';

interface SelectionActionBarProps {
  count: number;
  onClear: () => void;
  actions: React.ReactNode;
  visible: boolean;
}

const SelectionActionBar: React.FC<SelectionActionBarProps> = ({ count, onClear, actions, visible }) => {
  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-full px-4 py-3 flex items-center gap-4 shadow-[var(--shadow-lg)] z-[200] backdrop-blur-md">
      <div className="flex items-center gap-2 pr-4 border-r border-[var(--border)]">
        <button 
          onClick={onClear}
          className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          title="Descartar selección"
        >
          <X size={16} />
        </button>
        <span className="text-sm font-medium text-[var(--accent)] font-['Inter']">
          {count} seleccionados
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        {actions}
      </div>
    </div>
  );
};

export default SelectionActionBar;
