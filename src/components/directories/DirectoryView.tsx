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
  const openViewer = useUiStore(state => state.openViewer);

  useEffect(() => {
    if (!selectedPath) {
      setMedia([]);
      return;
    }

    const loadMedia = async () => {
      setLoading(true);
      try {
        const items = await invoke<MediaItem[]>('get_directory_media', { path: selectedPath });
        setMedia(items);
      } catch (e) {
        console.error('Error loading directory media', e);
      } finally {
        setLoading(false);
      }
    };
    loadMedia();
  }, [selectedPath]);

  if (!selectedPath) {
    return (
      <div className="flex-1 flex items-center justify-center text-neutral-500">
        <p>Selecciona una carpeta del panel izquierdo.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <h2 className="text-xl font-bold mb-4 text-neutral-200 truncate">{selectedPath}</h2>
      
      {loading ? (
        <div className="flex items-center justify-center h-32 text-neutral-400">
          Cargando...
        </div>
      ) : media.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-neutral-500">
          <p>No hay imágenes en esta carpeta.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-24">
          {media.map((item, index) => (
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