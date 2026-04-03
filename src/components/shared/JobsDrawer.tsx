import React from 'react';
import { X, AlertCircle, PlayCircle, Clock } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { useJobsStore } from '../../store/jobsStore';
import ProgressBar from './ProgressBar';
import StatusBadge from './StatusBadge';

const JobsDrawer: React.FC = () => {
  const { isJobsPanelOpen, toggleJobsPanel } = useUiStore();
  const { activeJobs, failedJobs, retryJob } = useJobsStore();
  
  if (!isJobsPanelOpen) return null;
  
  const allJobs = [...activeJobs, ...failedJobs];

  return (
    <div className="absolute inset-y-0 right-0 w-[400px] bg-[var(--bg-secondary)] border-l border-[var(--border)] shadow-[var(--shadow-lg)] flex flex-col z-40 transform transition-transform duration-300">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-tertiary)]">
        <h2 className="font-['Space_Grotesk'] font-bold text-lg text-[var(--text-primary)]">
          Trabajos en Segundo Plano
        </h2>
        <button 
          onClick={toggleJobsPanel}
          className="p-1 rounded-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {allJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-[var(--text-muted)]">
            <Clock size={32} className="mb-2 opacity-50" />
            <p className="text-sm">No hay trabajos activos ni fallidos</p>
          </div>
        ) : (
          allJobs.map(job => (
            <div key={job.id} className="bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-[var(--radius-md)] p-4 flex flex-col gap-3 relative">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-semibold text-[var(--text-primary)] font-['Space_Grotesk']">
                    {job.job_type}
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate max-w-[220px]" title={job.scope_value}>
                    {job.scope_value}
                  </p>
                </div>
                <StatusBadge status={job.status} />
              </div>
              
              {job.status === 'processing' || job.status === 'pending' ? (
                <ProgressBar current={job.progress_current} total={job.progress_total} />
              ) : null}
              
              {job.error_message && (
                <div className="flex items-start gap-2 text-xs text-[var(--danger)] bg-[var(--danger)]/10 p-2 rounded-[var(--radius-sm)] border border-[var(--danger)]/20 mt-1">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span className="flex-1 break-words">{job.error_message}</span>
                </div>
              )}
              
              {job.status === 'error' && (
                <button 
                  onClick={() => retryJob(job.id)}
                  className="absolute right-4 bottom-4 text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                  title="Reintentar"
                >
                  <PlayCircle size={18} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default JobsDrawer;
