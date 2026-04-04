import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { MediaItem } from '../../types/media';
import { DirectoryListItem, DirectorySummary } from '../../types/directory';
import ImageCard from '../gallery/ImageCard';
import DirectoryHeader from './DirectoryHeader';
import SelectionActionBar from '../shared/SelectionActionBar';
import { useUiStore } from '../../store/uiStore';

interface DirectoryViewProps {
    selectedPath: string | null;
    selectedDirectory: DirectoryListItem | null;
    childDirectories: DirectoryListItem[];
    onSelectDirectory: (path: string) => void;
}

const DirectoryView: React.FC<DirectoryViewProps> = ({
    selectedPath,
    selectedDirectory,
    childDirectories,
    onSelectDirectory,
}) => {
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [summary, setSummary] = useState<DirectorySummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState<string | null>(null);
    const { openViewer, selectedMediaIds, clearSelection } = useUiStore(state => ({
        openViewer: state.openViewer,
        selectedMediaIds: state.selectedMediaIds,
        clearSelection: state.clearSelection,
    }));

    useEffect(() => {
        if (!selectedPath) {
            setMedia([]);
            setSummary(null);
            return;
        }

        const loadDirectoryData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [items, summaryData] = await Promise.all([
                    invoke<MediaItem[]>('get_directory_media', { directory: selectedPath }),
                    invoke<DirectorySummary>('get_directory_summary', { directory: selectedPath }),
                ]);
                setMedia(items);
                setSummary(summaryData);
            } catch (e) {
                console.error('Error loading directory media', e);
                setError('No se pudo cargar el contenido del directorio.');
            } finally {
                setLoading(false);
            }
        };
        loadDirectoryData();
    }, [selectedPath]);

    const runDirectoryAction = async (command: string) => {
        if (!selectedPath) {
            return;
        }
        try {
            const response = await invoke<string>(command, { directory: selectedPath });
            setActionMessage(response);
        } catch (actionError) {
            console.error(`Action failed: ${command}`, actionError);
            setActionMessage('No se pudo ejecutar la acción solicitada.');
        }
    };

    if (!selectedPath || !selectedDirectory) {
        return (
            <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--text-secondary)' }}>
                <p>Selecciona una carpeta del panel izquierdo.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 p-4 overflow-y-auto">
            <DirectoryHeader
                directory={selectedDirectory}
                summary={summary}
                statusMessage={actionMessage}
                onReanalyze={() => runDirectoryAction('reanalyze_directory')}
                onReprocessFaces={() => runDirectoryAction('reprocess_faces_in_directory')}
                onRebuildThumbnails={() => runDirectoryAction('rebuild_thumbnails_for_directory')}
                onFindDuplicates={() => runDirectoryAction('find_duplicates_in_directory')}
            />

            {childDirectories.length > 0 && (
                <div className="mb-4 flex items-center gap-2 flex-wrap">
                    {childDirectories.slice(0, 24).map((child) => (
                        <button
                            key={child.path}
                            onClick={() => onSelectDirectory(child.path)}
                            className="px-2.5 py-1 text-xs rounded-full"
                            style={{
                                background: 'var(--bg-tertiary)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-secondary)',
                            }}
                            title={child.path}
                        >
                            {child.name} ({child.media_count})
                        </button>
                    ))}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center h-32" style={{ color: 'var(--text-secondary)' }}>
                    Cargando...
                </div>
            ) : error ? (
                <div className="flex items-center justify-center h-32" style={{ color: 'var(--danger)' }}>
                    {error}
                </div>
            ) : media.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48" style={{ color: 'var(--text-secondary)' }}>
                    <p>No hay imágenes en esta carpeta.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-24">
                    {media.map((item) => (
                        <ImageCard
                            key={item.id}
                            item={item}
                            onClick={() => openViewer(item.id)}
                        />
                    ))}
                </div>
            )}

            <SelectionActionBar
                count={selectedMediaIds.length}
                visible={selectedMediaIds.length > 0}
                onClear={clearSelection}
                actions={(
                    <>
                        <button
                            className="px-3 py-1.5 text-xs rounded-full"
                            style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)' }}
                            onClick={() => setActionMessage('Exportación ZIP masiva pendiente de integración.')}
                        >
                            Exportar ZIP
                        </button>
                        <button
                            className="px-3 py-1.5 text-xs rounded-full"
                            style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)' }}
                            onClick={() => setActionMessage('Búsqueda de duplicados masiva pendiente de integración.')}
                        >
                            Duplicados
                        </button>
                    </>
                )}
            />
        </div>
    );
};

export default DirectoryView;