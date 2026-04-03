import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useUiStore();

  return (
    <button 
      onClick={toggleTheme}
      className="p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
      title={theme === 'dark' ? "Modo Claro" : "Modo Oscuro"}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};

export default ThemeToggle;
