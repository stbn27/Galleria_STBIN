import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total, label, className = '' }) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className={`w-full flex flex-col gap-1 ${className}`}>
      {label && (
        <div className="flex justify-between text-xs text-[var(--text-secondary)]">
          <span>{label}</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div className="h-1.5 w-full bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
        <div 
          className="h-full bg-[var(--accent)] transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
