import React, { memo, useRef } from 'react';
import { Star, Play, AlertCircle, ImageOff, Loader2 } from 'lucide-react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { type MediaItem } from '../../types/media';
import { useUiStore } from '../../store/uiStore';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

interface ImageCardProps {
  item: MediaItem;
  onClick?: () => void;
}

/**
 * ImageCard — Tarjeta visual de un medio en la grilla de galería.
 * Sigue SKILL_UI.md: sin padding, border-radius: var(--radius-md),
 * overflow hidden, hover scale(1.01), overlay de selección.
 *
 * @example
 * <ImageCard item={mediaItem} onClick={() => openViewer(mediaItem.id)} />
 */
const ImageCard: React.FC<ImageCardProps> = ({ item, onClick }) => {
  const { selectedMediaIds, selectMedia, deselectMedia } = useUiStore();
  const isSelected = selectedMediaIds.includes(item.id);
  const isCorrupted = item.is_corrupted === 1;
  const isVideo = item.media_type === 'video';
  const isFavorite = item.is_favorite === 1;

  // Ref para el intersection observer
  const cardRef = useRef<HTMLDivElement>(null);

  // Agregar rootMargin para cargar imágenes un poco antes de que entren a la pantalla o mantenerlas si salen poco
  const inView = useIntersectionObserver(cardRef, { rootMargin: '120px' });

  // Prioriza miniatura si existe; si no, usa imagen original en caliente para UX inmediata.
  // En video se mantiene placeholder hasta tener preview/minithumb.
  const imageSrc = !isCorrupted
    ? item.thumbnail_path
      ? convertFileSrc(item.thumbnail_path)
      : !isVideo
        ? convertFileSrc(item.path)
        : null
    : null;

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelected) {
      deselectMedia(item.id);
    } else {
      selectMedia(item.id);
    }
  };

  const aspectRatioStyle = item.width && item.height
    ? `${item.width} / ${item.height}`
    : '1 / 1';

  return (
    <div
      ref={cardRef}
      className="image-card relative cursor-pointer overflow-hidden group bg-[var(--bg-tertiary)]"
      style={{
        borderRadius: 'var(--radius-md)',
        aspectRatio: aspectRatioStyle,
        minHeight: '120px',
        contentVisibility: 'auto',
        containIntrinsicSize: '200px 200px',
      }}
      onClick={onClick}
    >
      {/* Contenido de la imagen o placeholder */}
      {isCorrupted ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-muted)] gap-2">
          <AlertCircle size={28} />
          <span className="text-xs text-center px-2">
            {isVideo ? 'No se pudo abrir el video' : 'No se pudo abrir la imagen'}
          </span>
        </div>
      ) : !imageSrc ? (
        <ThumbnailPlaceholder item={item} />
      ) : inView ? (
        <img
          src={imageSrc}
          alt={item.filename}
          loading="lazy"
          decoding="async"
          className="w-full h-full block object-cover transition-opacity duration-300"
        />
      ) : null}

      {/* Overlay de selección */}
      {isSelected && (
        <div className="absolute inset-0" style={{ background: 'rgba(79, 125, 255, 0.25)' }}>
          <div className="absolute inset-0 ring-2 ring-[var(--accent)] rounded-[var(--radius-md)]" />
        </div>
      )}

      {/* Checkbox en hover o si está seleccionado */}
      <button
        onClick={handleSelect}
        className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all text-xs font-bold
          ${isSelected
            ? 'bg-[var(--accent)] border-[var(--accent)] text-white opacity-100'
            : 'border-white/60 bg-black/30 text-white opacity-0 group-hover:opacity-100'
          }`}
        title={isSelected ? 'Deseleccionar' : 'Seleccionar'}
      >
        {isSelected && '✓'}
      </button>

      {/* Badge de favorito */}
      {isFavorite && (
        <div className="absolute top-2 right-2 text-[var(--warning)]">
          <Star size={16} fill="currentColor" />
        </div>
      )}

      {/* Badge de video */}
      {isVideo && !isCorrupted && (
        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 rounded-full px-2 py-0.5">
          <Play size={12} fill="white" className="text-white" />
          {item.duration_ms && (
            <span className="text-[10px] text-white font-medium">
              {formatDuration(item.duration_ms)}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

function ThumbnailPlaceholder({ item }: { item: MediaItem }) {
  if (item.media_type === 'video') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-muted)] gap-2">
        <Play size={20} />
        <span className="text-xs text-center px-3">Preview de video al abrir.</span>
      </div>
    );
  }

  if (item.thumbnail_status === 'unsupported') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-muted)] gap-2">
        <ImageOff size={24} />
        <span className="text-xs text-center px-3">Formato sin miniatura en esta versión.</span>
      </div>
    );
  }

  if (item.thumbnail_status === 'error') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-muted)] gap-2">
        <AlertCircle size={24} />
        <span className="text-xs text-center px-3">No se pudo preparar la vista previa.</span>
      </div>
    );
  }

  if (item.thumbnail_status === 'queued' || item.thumbnail_status === 'processing') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-muted)] gap-2">
        <Loader2 size={20} className="animate-spin" />
        <span className="text-xs text-center px-3">Preparando vista previa...</span>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-muted)] gap-2">
      <ImageOff size={24} />
      <span className="text-xs text-center px-3">Vista previa disponible al abrir o al entrar en pantalla.</span>
    </div>
  );
}

/** Formatea duración en milisegundos a MM:SS */
function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default memo(ImageCard);
