import { create } from 'zustand';

export interface JobLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export interface Job {
  id: string;
  job_type: string;
  scope_type: string;
  scope_value: string;
  status: 'pending' | 'processing' | 'done' | 'error' | 'stale';
  progress_current: number;
  progress_total: number;
  error_message?: string;
  logs: JobLog[];
}

interface JobsState {
  activeJobs: Job[];
  failedJobs: Job[];
  
  setActiveJobs: (jobs: Job[]) => void;
  setFailedJobs: (jobs: Job[]) => void;
  addJob: (job: Job) => void;
  updateJob: (id: string, updates: Partial<Job>) => void;
  removeJob: (id: string) => void;
  retryJob: (id: string) => void;
}

export const useJobsStore = create<JobsState>((set) => ({
  activeJobs: [],
  failedJobs: [],
  
  setActiveJobs: (jobs) => set({ activeJobs: jobs }),
  setFailedJobs: (jobs) => set({ failedJobs: jobs }),
  addJob: (job) => set((state) => ({ 
    activeJobs: [...state.activeJobs, job] 
  })),
  updateJob: (id, updates) => set((state) => ({
    activeJobs: state.activeJobs.map(job => 
      job.id === id ? { ...job, ...updates } : job
    ),
    failedJobs: state.failedJobs.map(job => 
      job.id === id ? { ...job, ...updates } : job
    )
  })),
  removeJob: (id) => set((state) => ({
    activeJobs: state.activeJobs.filter(job => job.id !== id),
    failedJobs: state.failedJobs.filter(job => job.id !== id)
  })),
  retryJob: (id) => set((state) => {
    // In a real app, this would trigger a backend call to retry
    // Here we just move it from failed to active conceptually
    const jobToRetry = state.failedJobs.find(job => job.id === id);
    if (!jobToRetry) return state;
    
    return {
      failedJobs: state.failedJobs.filter(job => job.id !== id),
      activeJobs: [...state.activeJobs, { ...jobToRetry, status: 'pending', error_message: undefined }]
    };
  })
}));
