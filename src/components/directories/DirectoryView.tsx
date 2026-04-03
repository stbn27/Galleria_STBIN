import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { MediaItem } from '../../types/media';
import ImageCard from '../gallery/ImageCard';
import { useUiStore } from '../../store/uiStore';

interface DirectoryViewProps {
    selectedPath: string | null;
}

const DirectoryView: React.FC<DirectoryViewProps> = ({ selectedPath }) => {
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const openViewer = useUiStore(state => state.openViewer);

    useEffect(() => {
        if (!selectedPath) {
            setMedia([]);
            return;
        }

        const loadMedia = async () => {
            setLoading(true);
            setError(null);
            try {
                const items = await invoke<MediaItem[]>('get_directory_media', { directory: selectedPath });
                setMedia(items);
            } catch (e) {
                console.error('Error loading directory media', e);
                setError('No se pudo cargar el contenido del directorio.');
            } finally {
                setLoading(false);
            }
        };
        loadMedia();
    }, [selectedPath]);

    if (!selectedPath) {
        return (
            <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--text-secondary)' }}>
                <p>Selecciona una carpeta del panel izquierdo.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>{selectedPath}</h2>

                <div className="flex gap-2">
                    <button className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }} onClick={() => console.log('Re-analizar carpeta proxy')}>
                        Reanalizar
                    </button>
                    <button className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }} onClick={() => console.log('Reconstruir miniaturas proxy')}>
                        Miniaturas
                    </button>
                    <button className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }} onClick={() => console.log('Buscar duplicados proxy')}>
                        Duplicados
                    </button>
                </div>
            </div>

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
        </div>
    );
};

export default DirectoryView;