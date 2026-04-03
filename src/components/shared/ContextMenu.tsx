import React, { useEffect, useRef } from 'react';

// Basic implementation for a reusable context menu wrapper
interface ContextMenuProps {
  x: number;
  y: number;
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, visible, onClose, children }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div 
      ref={menuRef}
      className="fixed z-[100] bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] py-1 min-w-[200px]"
      style={{ top: y, left: x }}
    >
      {children}
    </div>
  );
};

export const ContextMenuItem: React.FC<{
  icon?: React.ElementType;
  label: string;
  onClick: () => void;
  danger?: boolean;
}> = ({ icon: Icon, label, onClick, danger }) => (
  <button
    role="menuitem"
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors font-['Inter']
      ${danger 
        ? 'text-[var(--danger)] hover:bg-[var(--danger)] hover:bg-opacity-10' 
        : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
      }`}
  >
    {Icon && <Icon size={16} />}
    <span>{label}</span>
  </button>
);

export const ContextMenuDivider: React.FC = () => (
  <div className="h-px bg-[var(--border)] my-1 w-full" />
);

export default ContextMenu;
