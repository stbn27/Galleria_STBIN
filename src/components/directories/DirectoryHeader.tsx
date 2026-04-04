import React from 'react';
import type { DirectoryListItem, DirectorySummary } from '../../types/directory';
import DirectoryBreadcrumb from './DirectoryBreadcrumb';

interface DirectoryHeaderProps {
    directory: DirectoryListItem;
    summary: DirectorySummary | null;
    statusMessage: string | null;
    onReanalyze: () => void;
    onReprocessFaces: () => void;
    onRebuildThumbnails: () => void;
    onFindDuplicates: () => void;
}

const headerButtonStyle: React.CSSProperties = {
    background: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
};

const DirectoryHeader: React.FC<DirectoryHeaderProps> = ({
    directory,
    summary,
    statusMessage,
    onReanalyze,
    onReprocessFaces,
    onRebuildThumbnails,
    onFindDuplicates,
}) => {
    const mediaCount = summary?.media_count ?? directory.media_count;

    return (
        <div className="mb-5">
            <DirectoryBreadcrumb path={directory.path} />

            <div className="mt-2 flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <h2 className="text-2xl font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {directory.name}
                    </h2>
                    <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }} title={directory.path}>
                        {directory.path}
                    </p>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                            {mediaCount} medios
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                            {summary?.image_count ?? 0} imágenes
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                            {summary?.video_count ?? 0} videos
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                            {summary?.thumbnail_ready ?? 0} miniaturas listas
                        </span>
                    </div>
                </div>

                <div className="flex gap-2 flex-wrap justify-end">
                    <button className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors" style={headerButtonStyle} onClick={onReanalyze}>
                        Reanalizar
                    </button>
                    <button className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors" style={headerButtonStyle} onClick={onReprocessFaces}>
                        Rostros
                    </button>
                    <button className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors" style={headerButtonStyle} onClick={onRebuildThumbnails}>
                        Miniaturas
                    </button>
                    <button className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors" style={headerButtonStyle} onClick={onFindDuplicates}>
                        Duplicados
                    </button>
                </div>
            </div>

            {statusMessage && (
                <p className="mt-2 text-xs" style={{ color: 'var(--accent)' }}>
                    {statusMessage}
                </p>
            )}
        </div>
    );
};

export default DirectoryHeader;
