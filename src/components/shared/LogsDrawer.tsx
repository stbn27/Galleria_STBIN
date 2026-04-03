import React from 'react';
import { X, Terminal } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { useJobsStore } from '../../store/jobsStore';

const LogsDrawer: React.FC = () => {
  const { isLogsPanelOpen, toggleLogsPanel } = useUiStore();
  const { activeJobs, failedJobs } = useJobsStore();
  
  if (!isLogsPanelOpen) return null;
  
  // Combine logs from all jobs for global view
  const allLogs = [...activeJobs, ...failedJobs].flatMap(job => job.logs);
  allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="absolute inset-x-0 bottom-0 h-[300px] bg-[var(--bg-secondary)] border-t border-[var(--border)] shadow-[var(--shadow-xl)] flex flex-col z-40 transform transition-transform duration-300">
      <div className="flex items-center justify-between px-6 py-2 border-b border-[var(--border)] bg-[var(--bg-tertiary)]">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-[var(--text-secondary)]" />
          <h2 className="font-['Space_Grotesk'] font-bold text-sm text-[var(--text-primary)]">
            Registro del Sistema (Logs)
          </h2>
        </div>
        <button 
          onClick={toggleLogsPanel}
          className="p-1 rounded-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
        >
          <X size={16} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1 font-mono text-xs bg-[var(--bg-primary)]">
        {allLogs.length === 0 ? (
          <div className="text-[var(--text-muted)] italic">No hay registros disponibles...</div>
        ) : (
          allLogs.map((log, index) => (
            <div key={index} className="flex gap-3 hover:bg-[var(--bg-hover)] px-2 py-1 rounded-sm">
              <span className="text-[var(--text-muted)] shrink-0">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className={`shrink-0 w-12 ${
                log.level === 'error' ? 'text-[var(--danger)]' : 
                log.level === 'warn' ? 'text-[var(--warning)]' : 'text-[var(--info)]'
              }`}>
                [{log.level.toUpperCase()}]
              </span>
              <span className="text-[var(--text-primary)] break-words w-full">
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LogsDrawer;
