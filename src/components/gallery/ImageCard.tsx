import React from 'react';
import { Star, Play, AlertCircle } from 'lucide-react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { type MediaItem } from '../../types/media';
import { useUiStore } from '../../store/uiStore';

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

  // Preferir thumbnail, fallback a path original
  const rawPath = item.thumbnail_path ?? item.path;
  const imageSrc = !isCorrupted && rawPath ? convertFileSrc(rawPath) : null;

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelected) {
      deselectMedia(item.id);
    } else {
      selectMedia(item.id);
    }
  };

  return (
    <div
      className="image-card relative cursor-pointer overflow-hidden group"
      style={{ borderRadius: 'var(--radius-md)' }}
      onClick={onClick}
    >
      {/* Contenido de la imagen o placeholder */}
      {isCorrupted || !imageSrc ? (
        <div className="w-full aspect-square bg-[var(--bg-tertiary)] flex flex-col items-center justify-center text-[var(--text-muted)] gap-2">
          <AlertCircle size={28} />
          <span className="text-xs text-center px-2">
            {isVideo ? 'No se pudo abrir el video' : 'No se pudo abrir la imagen'}
          </span>
        </div>
      ) : (
        <img
          src={imageSrc}
          alt={item.filename}
          loading="lazy"
          decoding="async"
          className="w-full h-full block object-cover"
          style={{
            aspectRatio: item.width && item.height
              ? `${item.width} / ${item.height}`
              : '1 / 1',
            minHeight: '120px',
          }}
        />
      )}

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

/** Formatea duración en milisegundos a MM:SS */
function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default ImageCard;
