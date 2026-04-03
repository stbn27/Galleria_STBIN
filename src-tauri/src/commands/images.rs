use std::sync::{Arc, OnceLock};

use serde::Serialize;
use sqlx::SqlitePool;
use tauri::{AppHandle, Emitter, State};
use tokio::sync::Semaphore;
use uuid::Uuid;
use walkdir::WalkDir;

use crate::db::schema::Image;
use crate::utils::paths::get_scan_roots;
use crate::utils::thumbnails;

/// Semáforo global que limita la concurrencia de generación de miniaturas.
/// Máximo 4 tareas simultáneas para no colapsar la CPU.
static THUMBNAIL_SEMAPHORE: OnceLock<Arc<Semaphore>> = OnceLock::new();

/// Obtiene (o inicializa) el semáforo compartido de miniaturas.
fn thumbnail_semaphore() -> Arc<Semaphore> {
    THUMBNAIL_SEMAPHORE
        .get_or_init(|| Arc::new(Semaphore::new(1)))
        .clone()
}

/// Payload del evento `thumbnail-ready` emitido al frontend.
#[derive(Debug, Clone, Serialize)]
pub struct ThumbnailReadyPayload {
    pub id: String,
    pub thumbnail_path: String,
}

/// Extensiones de imagen soportadas.
const IMAGE_EXTENSIONS: &[&str] = &[
    "png", "jpg", "jpeg", "svg", "webp", "ico", "heic", "tiff", "tif", "raw", "gif",
];

/// Extensiones de video soportadas.
const VIDEO_EXTENSIONS: &[&str] = &[
    "mp4", "avi", "mov", "mkv", "webm",
];

/// Verifica si una extensión corresponde a una imagen soportada.
fn is_supported_image(ext: &str) -> bool {
    IMAGE_EXTENSIONS.contains(&ext.to_lowercase().as_str())
}

/// Verifica si una extensión corresponde a un video soportado.
fn is_supported_video(ext: &str) -> bool {
    VIDEO_EXTENSIONS.contains(&ext.to_lowercase().as_str())
}

/// Detecta el tipo de medio basado en la extensión.
/// Retorna `Some("image")`, `Some("video")` o `None` si no es soportado.
fn detect_media_type(ext: &str) -> Option<&'static str> {
    let ext_lower = ext.to_lowercase();
    if IMAGE_EXTENSIONS.contains(&ext_lower.as_str()) {
        Some("image")
    } else if VIDEO_EXTENSIONS.contains(&ext_lower.as_str()) {
        Some("video")
    } else {
        None
    }
}

/// Escanea los directorios locales de medios y registra archivos nuevos en la BD.
///
/// Recorre recursivamente los directorios devueltos por `get_scan_roots()`,
/// filtra por formatos soportados e inserta registros con estado inicial
/// (`discovery_status = 'found'`, demás estados en `'pending'`).
/// Usa `INSERT OR IGNORE` para no duplicar entradas existentes por `path`.
#[tauri::command]
pub async fn scan_local_media(app: AppHandle, pool: State<'_, SqlitePool>) -> Result<u32, String> {
    let roots = get_scan_roots();
    let mut inserted: u32 = 0;
    let mut scanned: u32 = 0;
    let mut skipped: u32 = 0;

    println!("[scan] Iniciando escaneo — {} raíces encontradas", roots.len());
    for r in &roots {
        println!("[scan]   Raíz: {:?}", r);
    }

    for root in &roots {
        println!("[scan] Recorriendo: {:?}", root);
        for entry in WalkDir::new(root)
            .follow_links(true)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            let path = entry.path();

            // Solo archivos regulares
            if !path.is_file() {
                continue;
            }

            // Obtener extensión
            let ext = match path.extension().and_then(|e| e.to_str()) {
                Some(e) => e,
                None => continue,
            };

            // Verificar si es un formato soportado
            let media_type = match detect_media_type(ext) {
                Some(mt) => mt,
                None => {
                    skipped += 1;
                    continue;
                }
            };

            scanned += 1;

            // Verificar permiso de lectura
            let has_permission = std::fs::File::open(path).is_ok();

            let path_str = path.to_string_lossy().to_string();
            let filename = path
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_default();
            let directory = path
                .parent()
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_default();
            let extension = Some(ext.to_lowercase());

            // Obtener tamaño del archivo
            let size_bytes = std::fs::metadata(path)
                .map(|m| m.len() as i64)
                .ok();

            // Obtener fecha de modificación
            let modified_at = std::fs::metadata(path)
                .ok()
                .and_then(|m| m.modified().ok())
                .map(|t| {
                    let duration = t
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap_or_default();
                    chrono::DateTime::<chrono::Utc>::from_timestamp(
                        duration.as_secs() as i64,
                        duration.subsec_nanos(),
                    )
                    .unwrap_or_default()
                    .format("%Y-%m-%d %H:%M:%S")
                    .to_string()
                });

            let id = Uuid::new_v4().to_string();
            let has_perm_int: i32 = if has_permission { 1 } else { 0 };

            let result = sqlx::query(
                "INSERT OR IGNORE INTO images (id, path, filename, directory, extension, media_type, size_bytes, modified_at, has_read_permission, discovery_status, metadata_status, thumbnail_status, face_status, geocode_status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'found', 'pending', 'pending', 'pending', 'pending')"
            )
            .bind(&id)
            .bind(&path_str)
            .bind(&filename)
            .bind(&directory)
            .bind(&extension)
            .bind(media_type)
            .bind(size_bytes)
            .bind(&modified_at)
            .bind(has_perm_int)
            .execute(pool.inner())
            .await;

            match result {
                Ok(r) => {
                    if r.rows_affected() > 0 {
                        inserted += 1;
                        println!("[scan] ✓ Insertado: {}", filename);

                        // Generar miniatura en segundo plano con concurrencia limitada
                        if media_type == "image" {
                            let pool_clone = pool.inner().clone();
                            let path_clone = path.to_path_buf();
                            let id_clone = id.clone();
                            let ext_clone = ext.to_string();
                            let app_clone = app.clone();
                            let sem = thumbnail_semaphore();

                            tokio::spawn(async move {
                                // Adquirir permiso — bloquea hasta que haya un slot libre
                                let _permit = sem.acquire_owned().await;
                                if let Some(thumb_path) = thumbnails::generate_and_update(
                                    &pool_clone,
                                    &path_clone,
                                    &id_clone,
                                    &ext_clone,
                                ).await {
                                    let _ = app_clone.emit("thumbnail-ready", ThumbnailReadyPayload {
                                        id: id_clone,
                                        thumbnail_path: thumb_path,
                                    });
                                }
                                tokio::time::sleep(std::time::Duration::from_millis(100)).await;
                                // _permit se libera aquí automáticamente (Drop)
                            });
                        }
                    } else {
                        println!("[scan] — Ya existe: {}", filename);
                    }
                }
                Err(e) => {
                    // Registrar el error pero no detener el escaneo
                    println!("[scan] ✗ Error al insertar {}: {}", path_str, e);
                }
            }
        }
    }

    // --- RECUPERACIÓN DE MINIATURAS PENDIENTES (Auto-Sanación) ---
    let pending_thumbs: Vec<(String, String, Option<String>)> = sqlx::query_as(
        "SELECT id, path, extension FROM images WHERE thumbnail_status = 'pending' AND media_type = 'image'"
    )
    .fetch_all(pool.inner())
    .await
    .unwrap_or_default();

    if !pending_thumbs.is_empty() {
        println!("[scan] Recuperando {} miniaturas zombies...", pending_thumbs.len());
        for (id, path, ext_opt) in pending_thumbs {
            let pool_clone = pool.inner().clone();
            let path_clone = std::path::PathBuf::from(path);
            let id_clone = id.clone();
            let ext_clone = ext_opt.unwrap_or_default();
            let app_clone = app.clone();
            let sem = thumbnail_semaphore();

            tokio::spawn(async move {
                // Adquirir permiso del semáforo compartido
                let _permit = sem.acquire_owned().await;
                if let Some(thumb_path) = thumbnails::generate_and_update(
                    &pool_clone,
                    &path_clone,
                    &id_clone,
                    &ext_clone,
                ).await {
                    let _ = app_clone.emit("thumbnail-ready", ThumbnailReadyPayload {
                        id: id_clone,
                        thumbnail_path: thumb_path,
                    });
                }
                tokio::time::sleep(std::time::Duration::from_millis(100)).await;
                // _permit se libera aquí automáticamente (Drop)
            });
        }
    }

    println!("[scan] Escaneo finalizado — {} insertados, {} ya existentes, {} no soportados",
        inserted, scanned - inserted, skipped);

    Ok(inserted)
}

/// Devuelve el listado completo de imágenes/videos desde la base de datos.
///
/// Ordena por `added_at` descendente (los más recientes primero).
#[tauri::command]
pub async fn get_all_images(pool: State<'_, SqlitePool>) -> Result<Vec<Image>, String> {
    sqlx::query_as::<_, Image>("SELECT * FROM images ORDER BY added_at DESC")
        .fetch_all(pool.inner())
        .await
        .map_err(|e| format!("Error al obtener imágenes: {}", e))
}
