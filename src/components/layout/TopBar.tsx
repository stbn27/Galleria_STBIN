import React from 'react';
import { Search, Grid, List, Moon, Sun, Activity, Terminal } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';

const TopBar: React.FC = () => {
  const {
    theme,
    toggleTheme,
    viewMode,
    setViewMode,
    isJobsPanelOpen,
    toggleJobsPanel,
    isLogsPanelOpen,
    toggleLogsPanel
  } = useUiStore();

  return (
    <header className="h-[var(--topbar-height)] shrink-0 flex items-center justify-between px-6 bg-[var(--bg-primary)] border-b border-[var(--border)]">
      <div className="flex-1 flex items-center">
        {/* Placeholder for context title */}
        <h1 className="font-['Space_Grotesk'] font-bold ms-10 text-xl text-[var(--text-primary)]">
          Galería
        </h1>
      </div>

      <div className="flex-1 flex justify-center">
        <div className="relative w-full max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] rounded-[var(--radius-md)] pl-10 pr-4 py-2 text-[14px] font-['Inter'] focus:outline-none focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[var(--accent-subtle)] transition-all"
          />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-end gap-3">
        <div className="flex bg-[var(--bg-tertiary)] rounded-[var(--radius-md)] p-1 border border-[var(--border)]">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-sm transition-colors ${viewMode === 'grid' ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
            title="Vista de Cuadrícula"
          >
            <Grid size={16} />
          </button>
          <button
            onClick={() => setViewMode('carousel')}
            className={`p-1.5 rounded-sm transition-colors ${viewMode === 'carousel' ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
            title="Vista de Carrusel"
          >
            <List size={16} />
          </button>
        </div>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          title={theme === 'dark' ? "Modo Claro" : "Modo Oscuro"}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          onClick={toggleJobsPanel}
          className={`p-2 rounded-full transition-colors ${isJobsPanelOpen ? 'text-[var(--accent)] bg-[var(--accent-subtle)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'}`}
          title="Panel de Trabajos"
        >
          <Activity size={18} />
        </button>

        <button
          onClick={toggleLogsPanel}
          className={`p-2 rounded-full transition-colors ${isLogsPanelOpen ? 'text-[var(--accent)] bg-[var(--accent-subtle)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'}`}
          title="Panel de Logs"
        >
          <Terminal size={18} />
        </button>
      </div>
    </header>
  );
};

export default TopBar;
