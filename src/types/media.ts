/**
 * MediaItem — Representa un medio (imagen o video) de la base de datos.
 * Alineado al struct `Image` de Rust (`src-tauri/src/db/schema.rs`).
 */
export interface MediaItem {
  id: string;
  path: string;
  filename: string;
  directory: string;
  extension: string | null;
  mime_type: string | null;
  media_type: string; // 'image' | 'video'

  file_hash: string | null;
  binary_hash: string | null;
  perceptual_hash: string | null;
  source_image_id: string | null;

  size_bytes: number | null;
  width: number | null;
  height: number | null;
  duration_ms: number | null;
  frame_rate: number | null;

  taken_at: string | null;
  added_at: string | null;
  modified_at: string | null;
  last_scanned_at: string | null;

  camera_make: string | null;
  camera_model: string | null;
  focal_length: string | null;
  aperture: string | null;
  iso: number | null;
  orientation: number | null;

  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  location_name: string | null;

  thumbnail_path: string | null;
  preview_path: string | null;

  is_favorite: number | null;
  is_deleted: number | null;
  deleted_at: string | null;
  is_corrupted: number | null;
  has_read_permission: number | null;

  applied_rotation: number | null;

  discovery_status: string | null;
  metadata_status: string | null;
  thumbnail_status: string | null;
  face_status: string | null;
  geocode_status: string | null;

  metadata_error: string | null;
  thumbnail_error: string | null;
  face_error: string | null;
  geocode_error: string | null;
}
