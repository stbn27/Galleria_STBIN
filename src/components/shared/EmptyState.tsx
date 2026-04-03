import React from 'react';
import { FileQuestion } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon: Icon = FileQuestion, 
  title, 
  description, 
  action 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center h-full w-full">
      <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mb-4 text-[var(--text-muted)]">
        <Icon size={32} />
      </div>
      <h3 className="text-xl font-['Space_Grotesk'] text-[var(--text-primary)] mb-2">{title}</h3>
      {description && (
        <p className="text-[var(--text-secondary)] text-sm max-w-md mb-6">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
