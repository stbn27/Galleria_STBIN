import React from 'react';
import { ChevronRight } from 'lucide-react';

interface DirectoryBreadcrumbProps {
    path: string;
}

const DirectoryBreadcrumb: React.FC<DirectoryBreadcrumbProps> = ({ path }) => {
    const parts = path.split('/').filter(Boolean);

    if (parts.length === 0) {
        return (
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                /
            </p>
        );
    }

    return (
        <div className="flex items-center gap-1 text-xs overflow-x-auto" style={{ color: 'var(--text-secondary)' }}>
            <span>/</span>
            {parts.map((part, index) => (
                <React.Fragment key={`${part}-${index}`}>
                    <span className="truncate max-w-[180px]">{part}</span>
                    {index < parts.length - 1 && <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />}
                </React.Fragment>
            ))}
        </div>
    );
};

export default DirectoryBreadcrumb;
