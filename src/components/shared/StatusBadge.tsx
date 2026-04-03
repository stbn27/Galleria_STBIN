import React from 'react';

type Status = 'pending' | 'processing' | 'done' | 'error' | 'stale';

interface StatusBadgeProps {
  status: Status;
  label?: string;
}

const statusMap: Record<Status, { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'status-badge pending text-[var(--warning)] border-[var(--warning)]' },
  processing: { label: 'Procesando', className: 'status-badge processing text-[var(--info)] border-[var(--info)]' },
  done: { label: 'Completado', className: 'status-badge done text-[var(--success)] border-[var(--success)]' },
  error: { label: 'Error', className: 'status-badge error text-[var(--danger)] border-[var(--danger)]' },
  stale: { label: 'Sin cambios', className: 'status-badge stale text-[var(--text-muted)] border-[var(--border)]' },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const config = statusMap[status];
  
  return (
    <span className={`badge border rounded-[var(--radius-sm)] px-2 py-0.5 ${config.className}`}>
      {label || config.label}
    </span>
  );
};

export default StatusBadge;
