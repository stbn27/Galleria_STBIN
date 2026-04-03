import React from 'react';
import { AlertCircle } from 'lucide-react';
import EmptyState from './EmptyState';

interface ErrorPlaceholderProps {
  message?: string;
  action?: React.ReactNode;
}

const ErrorPlaceholder: React.FC<ErrorPlaceholderProps> = ({ 
  message = "No se pudo cargar el elemento", 
  action 
}) => {
  return (
    <div className="h-full w-full bg-[var(--bg-secondary)] flex items-center justify-center border border-[var(--border)] rounded-[var(--radius-md)] overflow-hidden">
      <EmptyState 
        icon={AlertCircle} 
        title="Ocurrió un error" 
        description={message} 
        action={action} 
      />
    </div>
  );
};

export default ErrorPlaceholder;
