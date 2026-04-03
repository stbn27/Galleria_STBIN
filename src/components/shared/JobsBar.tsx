import React from 'react';
import { useJobsStore } from '../../store/jobsStore';
import ProgressBar from './ProgressBar';

const JobsBar: React.FC = () => {
  const { activeJobs } = useJobsStore();
  
  if (activeJobs.length === 0) return null;
  
  // Aggregate jobs for a simplified global view in the bar
  const totalJobs = activeJobs.length;
  const currentTotal = activeJobs.reduce((acc, job) => acc + job.progress_current, 0);
  const maxTotal = activeJobs.reduce((acc, job) => acc + (job.progress_total || 1), 0);
  
  return (
    <div className="h-[var(--jobsbar-height)] shrink-0 bg-[var(--bg-tertiary)] border-b border-[var(--border)] px-6 flex items-center gap-4">
      <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap">
        {totalJobs} proceso{totalJobs > 1 ? 's' : ''} activo{totalJobs > 1 ? 's' : ''}
      </div>
      <div className="flex-1 max-w-md">
        <ProgressBar current={currentTotal} total={maxTotal} className="mt-1" />
      </div>
    </div>
  );
};

export default JobsBar;
