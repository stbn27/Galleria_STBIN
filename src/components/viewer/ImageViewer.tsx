import React, { useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { useUiStore } from '../../store/uiStore';
import { useImageStore } from '../../store/imageStore';

const ImageViewer: React.FC = () => {
    const { activeViewerId, closeViewer } = useUiStore();
    const { images, requestThumbnail } = useImageStore();

    const activeItem = images.find((img) => img.id === activeViewerId);

    useEffect(() => {
        if (!activeViewerId) {
            return;
        }

        requestThumbnail(activeViewerId);
    }, [activeViewerId, requestThumbnail]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                closeViewer();
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [closeViewer]);

    if (!activeViewerId || !activeItem) {
        return null;
    }

    const previewSrc = activeItem.thumbnail_path
        ? convertFileSrc(activeItem.thumbnail_path)
        : convertFileSrc(activeItem.path);

    const showError = activeItem.is_corrupted === 1;

    return (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-6" onClick={closeViewer}>
            <button
                onClick={closeViewer}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                title="Cerrar visor"
            >
                <X size={18} />
            </button>

            <div
                className="relative w-full h-full max-w-6xl max-h-[90vh] flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
            >
                {showError ? (
                    <div className="flex flex-col items-center gap-3 text-white/80">
                        <AlertCircle size={30} />
                        <p>No se pudo abrir este archivo.</p>
                    </div>
                ) : (
                    <img
                        src={previewSrc}
                        alt={activeItem.filename}
                        className="max-w-full max-h-full object-contain rounded-md"
                    />
                )}
            </div>
        </div>
    );
};

export default ImageViewer;
