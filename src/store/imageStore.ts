import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { type MediaItem } from '../types/media';

interface ImageStoreState {
  images: MediaItem[];
  loading: boolean;
  scanning: boolean;
  error: string | null;

  fetchImages: () => Promise<void>;
  scanImages: () => Promise<void>;
}

/**
 * Store de imágenes para la galería principal.
 * Consume los comandos `get_all_images` y `scan_local_media` de Tauri.
 *
 * @example
 * const { images, loading, fetchImages, scanImages } = useImageStore();
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
      // Recargar después del escaneo
      await get().fetchImages();
    } catch (err) {
      console.warn('[imageStore] No se pudo invocar scan_local_media:', err);
    } finally {
      set({ scanning: false });
    }
  },
}));

