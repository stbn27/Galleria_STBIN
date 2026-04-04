import React, { useMemo, useState } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { Folder, Search, Film } from 'lucide-react';
import type { DirectoryListItem } from '../../types/directory';

interface DirectorySidebarProps {
    directories: DirectoryListItem[];
    selectedPath: string | null;
    onSelect: (path: string) => void;
}

function PreviewStrip({ item }: { item: DirectoryListItem }) {
    if (item.preview_items.length === 0) {
        return (
            <div className="flex items-center gap-1">
                {[0, 1, 2].map((index) => (
                    <div
                        key={index}
                        className="h-9 w-9 rounded"
                        style={{
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border)',
                        }}
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1">
            {item.preview_items.slice(0, 3).map((preview) => {
                const isImage = preview.media_type === 'image';
                const src = preview.thumbnail_path
                    ? convertFileSrc(preview.thumbnail_path)
                    : isImage
                        ? convertFileSrc(preview.path)
                        : null;

                return (
                    <div
                        key={preview.id}
                        className="h-9 w-9 rounded overflow-hidden flex items-center justify-center"
                        style={{
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border)',
                        }}
                    >
                        {src ? (
                            <img src={src} alt="preview" loading="lazy" className="h-full w-full object-cover" />
                        ) : (
                            <Film size={14} style={{ color: 'var(--text-muted)' }} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

const DirectorySidebar: React.FC<DirectorySidebarProps> = ({ directories, selectedPath, onSelect }) => {
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        if (!normalized) {
            return directories;
        }

        return directories.filter((directory) =>
            directory.name.toLowerCase().includes(normalized)
            || directory.path.toLowerCase().includes(normalized)
        );
    }, [directories, query]);

    return (
        <aside
            className="w-80 h-full border-r flex flex-col"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
        >
            <div className="px-3 pt-3 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Carpetas
                </p>
                <label
                    className="flex items-center gap-2 px-2 py-2 rounded"
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
                >
                    <Search size={14} style={{ color: 'var(--text-secondary)' }} />
                    <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Buscar carpeta..."
                        className="w-full bg-transparent outline-none text-sm"
                        style={{ color: 'var(--text-primary)' }}
                    />
                </label>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {filtered.length === 0 ? (
                    <div className="px-2 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        No hay carpetas que coincidan.
                    </div>
                ) : (
                    filtered.map((item) => {
                        const isSelected = selectedPath === item.path;
                        return (
                            <button
                                key={item.path}
                                onClick={() => onSelect(item.path)}
                                title={item.path}
                                className="w-full text-left rounded-lg p-2 mb-2 transition-colors"
                                style={{
                                    background: isSelected ? 'var(--accent-subtle)' : 'transparent',
                                    border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                                }}
                            >
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Folder size={15} style={{ color: isSelected ? 'var(--accent)' : 'var(--text-secondary)' }} />
                                        <span className="truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                            {item.name}
                                        </span>
                                    </div>
                                    <span
                                        className="text-[11px] px-2 py-0.5 rounded-full"
                                        style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}
                                    >
                                        {item.media_count}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between gap-2">
                                    <PreviewStrip item={item} />
                                    <div className="text-right">
                                        {item.has_children ? (
                                            <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                                                {item.child_count} subcarpetas
                                            </p>
                                        ) : (
                                            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                                Sin subcarpetas
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <p className="mt-2 text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                                    {item.path}
                                </p>
                            </button>
                        );
                    })
                )}
            </div>
        </aside>
    );
};

export default DirectorySidebar;
