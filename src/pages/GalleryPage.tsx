import React, { useEffect } from 'react';
import { Image as ImageIcon, FolderSearch } from 'lucide-react';
import { useImageStore } from '../store/imageStore';
import ImageCard from '../components/gallery/ImageCard';
import EmptyState from '../components/shared/EmptyState';
import { useUiStore } from '../store/uiStore';

/**
 * GalleryPage — Vista principal de la galería.
 * Muestra una grilla CSS responsiva con las imágenes cargadas desde el backend.
 */
const GalleryPage: React.FC = () => {
  const { images, loading, scanning, error, fetchImages, scanImages, requestThumbnail, initThumbnailListener } = useImageStore();
  const { openViewer } = useUiStore();

  // Carga inicial rápida desde la BD. El escaneo masivo queda manual para no
  // recalentar CPU y evitar flashes al remontar la vista en desarrollo.
  useEffect(() => {
    fetchImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Escuchar el evento 'thumbnail-ready' emitido por Rust cuando una miniatura
  // está lista; actualiza el item directamente sin refetch completo.
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    initThumbnailListener().then((fn) => { unlisten = fn; });
    return () => { unlisten?.(); };
  }, [initThumbnailListener]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--text-secondary)]">Cargando galería...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <EmptyState
          title="Error al cargar la galería"
          description={error}
          action={
            <button
              onClick={fetchImages}
              className="px-4 py-2 bg-[var(--accent)] text-white rounded-full text-sm font-semibold hover:bg-[var(--accent-hover)] transition-colors"
            >
              Reintentar
            </button>
          }
        />
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <EmptyState
          icon={ImageIcon}
          title="No hay medios para mostrar todavía"
          description="Escanea un directorio para comenzar a ver tus fotos y videos aquí."
          action={
            <button
              onClick={scanImages}
              disabled={scanning}
              className="px-5 py-2.5 bg-[var(--accent)] text-white rounded-full text-sm font-semibold hover:bg-[var(--accent-hover)] transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <FolderSearch size={16} />
              {scanning ? 'Escaneando...' : 'Escanear ahora'}
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Contador de medios y botón de escaneo */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <p className="text-sm text-[var(--text-secondary)]">
          {images.length} {images.length === 1 ? 'medio' : 'medios'}
        </p>
        <button
          onClick={scanImages}
          disabled={scanning}
          className="px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-full hover:border-[var(--border-hover)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5 disabled:opacity-50"
          title="Escanear nuevos medios"
        >
          <FolderSearch size={14} />
          {scanning ? 'Escaneando...' : 'Escanear'}
        </button>
      </div>

      {/* Contenedor scrollable — necesario para que lazy loading funcione */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div
          className="grid w-full"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '4px',
          }}
        >
          {images.map((item) => (
            <ImageCard
              key={item.id}
              item={item}
              onClick={() => {
                requestThumbnail(item.id);
                openViewer(item.id);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default GalleryPage;


