import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { type MediaItem } from '../types/media';

/** Payload del evento `thumbnail-ready` emitido desde Rust. */
interface ThumbnailReadyPayload {
  id: string;
  thumbnail_path: string;
}

interface ImageStoreState {
  images: MediaItem[];
  loading: boolean;
  scanning: boolean;
  error: string | null;

  fetchImages: () => Promise<void>;
  scanImages: () => Promise<void>;
  initThumbnailListener: () => Promise<() => void>;
}

/**
 * Store de imágenes para la galería principal.
 * Consume los comandos `get_all_images` y `scan_local_media` de Tauri.
 * Escucha el evento `thumbnail-ready` para actualizar miniaturas reactivamente
 * sin necesidad de refetch completo.
 *
 * @example
 * const { images, loading, fetchImages, scanImages, initThumbnailListener } = useImageStore();
 */
export const useImageStore = create<ImageStoreState>((set, get) => ({
  images: [],
  loading: false,
  scanning: false,
  error: null,

  fetchImages: async () => {
    set({ loading: true, error: null });
    try {
      const data = await invoke<MediaItem[]>('get_all_images');
      set({ images: data, loading: false });
    } catch (err) {
      console.warn('[imageStore] No se pudo invocar get_all_images:', err);
      set({ images: [], error: String(err), loading: false });
    }
  },

  scanImages: async () => {
    set({ scanning: true });
    try {
      const count = await invoke<number>('scan_local_media');
      console.info(`[imageStore] Escaneo completado: ${count} medios encontrados.`);
      // Recargar la lista completa tras el escaneo inicial
      await get().fetchImages();
    } catch (err) {
      console.warn('[imageStore] No se pudo invocar scan_local_media:', err);
    } finally {
      set({ scanning: false });
    }
  },

  /**
   * Registra un listener del evento `thumbnail-ready` emitido por Rust.
   * Actualiza solo el item afectado en el array (patch reactivo por id).
   * Retorna una función de limpieza para desuscribirse.
   *
   * @example
   * useEffect(() => {
   *   let unlisten: (() => void) | undefined;
   *   initThumbnailListener().then(fn => { unlisten = fn; });
   *   return () => unlisten?.();
   * }, []);
   */
  initThumbnailListener: async () => {
    const unlisten = await listen<ThumbnailReadyPayload>('thumbnail-ready', (event) => {
      const { id, thumbnail_path } = event.payload;
      set((state) => ({
        images: state.images.map((img) =>
          img.id === id
            ? { ...img, thumbnail_path, thumbnail_status: 'done' }
            : img
        ),
      }));
    });
    return unlisten;
  },
}));


