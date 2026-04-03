import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { type MediaItem } from '../types/media';

const FLUSH_BATCH_MS = 120;
const MAX_BATCH_IDS = 12;

let flushHandle: ReturnType<typeof setTimeout> | null = null;

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
  requestedThumbnailIds: string[];
  queuedThumbnailIds: string[];

  fetchImages: () => Promise<void>;
  scanImages: () => Promise<void>;
  requestThumbnail: (id: string) => Promise<void>;
  requestVisibleThumbnails: (ids: string[]) => Promise<void>;
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
  requestedThumbnailIds: [],
  queuedThumbnailIds: [],

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
      // Evita flash completo cuando no hay cambios reales.
      if (count > 0) {
        await get().fetchImages();
      }
    } catch (err) {
      console.warn('[imageStore] No se pudo invocar scan_local_media:', err);
    } finally {
      set({ scanning: false });
    }
  },

  requestThumbnail: async (id: string) => {
    const state = get();
    const item = state.images.find((img) => img.id === id);
    if (!item) return;

    const status = item.thumbnail_status;
    const hasThumb = Boolean(item.thumbnail_path);
    const alreadyRequested = state.requestedThumbnailIds.includes(id);

    if (
      hasThumb ||
      alreadyRequested ||
      status === 'ready' ||
      status === 'queued' ||
      status === 'processing' ||
      status === 'unsupported'
    ) {
      return;
    }

    set((prev) => ({
      requestedThumbnailIds: [...prev.requestedThumbnailIds, id],
      queuedThumbnailIds: prev.queuedThumbnailIds.includes(id)
        ? prev.queuedThumbnailIds
        : [...prev.queuedThumbnailIds, id],
      images: prev.images.map((img) =>
        img.id === id && img.thumbnail_status === 'missing'
          ? { ...img, thumbnail_status: 'queued' }
          : img
      ),
    }));

    if (!flushHandle) {
      flushHandle = setTimeout(async () => {
        const { queuedThumbnailIds } = get();
        const ids = queuedThumbnailIds.slice(0, MAX_BATCH_IDS);
        flushHandle = null;

        if (ids.length === 0) {
          return;
        }

        set((prev) => ({
          queuedThumbnailIds: prev.queuedThumbnailIds.filter((queuedId) => !ids.includes(queuedId)),
          images: prev.images.map((img) =>
            ids.includes(img.id) && img.thumbnail_status === 'queued'
              ? { ...img, thumbnail_status: 'processing' }
              : img
          ),
        }));

        try {
          await invoke<number>('request_thumbnails_for_visible', { ids });
        } catch (err) {
          console.warn('[imageStore] No se pudo invocar request_thumbnails_for_visible:', err);
          set((prev) => ({
            requestedThumbnailIds: prev.requestedThumbnailIds.filter((queuedId) => !ids.includes(queuedId)),
            images: prev.images.map((img) =>
              ids.includes(img.id) && img.thumbnail_status === 'processing'
                ? { ...img, thumbnail_status: 'error', thumbnail_error: String(err) }
                : img
            ),
          }));
        }
      }, FLUSH_BATCH_MS);
    }
  },

  requestVisibleThumbnails: async (ids: string[]) => {
    for (const id of ids) {
      await get().requestThumbnail(id);
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
        requestedThumbnailIds: state.requestedThumbnailIds.filter((requestedId) => requestedId !== id),
        queuedThumbnailIds: state.queuedThumbnailIds.filter((queuedId) => queuedId !== id),
        images: state.images.map((img) =>
          img.id === id
            ? { ...img, thumbnail_path, thumbnail_status: 'ready', thumbnail_error: null }
            : img
        ),
      }));
    });
    return unlisten;
  },
}));


