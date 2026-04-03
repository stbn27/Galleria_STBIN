use std::path::PathBuf;
use std::sync::{Arc, OnceLock};

use serde::Serialize;
use sqlx::SqlitePool;
use tauri::{AppHandle, Emitter, State};
use tokio::sync::Semaphore;
use uuid::Uuid;
use walkdir::WalkDir;

use crate::db::schema::Image;
use crate::utils::paths::{get_scan_roots, get_thumbnails_dir};
use crate::utils::thumbnails;

/// Semáforo global que limita la concurrencia de generación de miniaturas.
/// Máximo 3 tareas simultáneas para no colapsar la CPU.
static THUMBNAIL_SEMAPHORE: OnceLock<Arc<Semaphore>> = OnceLock::new();

/// Obtiene (o inicializa) el semáforo compartido de miniaturas.
fn thumbnail_semaphore() -> Arc<Semaphore> {
    THUMBNAIL_SEMAPHORE
    .get_or_init(|| Arc::new(Semaphore::new(3)))
        .clone()
}

/// Payload del evento `thumbnail-ready` emitido al frontend.
#[derive(Debug, Clone, Serialize)]
pub struct ThumbnailReadyPayload {
    pub id: String,
    pub thumbnail_path: String,
}

#[derive(Debug, Clone, sqlx::FromRow)]
struct DbThumbnailTarget {
    id: String,
    path: String,
    extension: Option<String>,
    thumbnail_status: Option<String>,
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
#[allow(dead_code)]
fn is_supported_image(ext: &str) -> bool {
    IMAGE_EXTENSIONS.contains(&ext.to_lowercase().as_str())
}

/// Verifica si una extensión corresponde a un video soportado.
#[allow(dead_code)]
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

fn thumbnail_cache_path_for_id(id: &str) -> PathBuf {
    get_thumbnails_dir().join(format!("{}.jpg", id))
}

fn scan_thumbnail_status(id: &str, media_type: &str, ext: &str) -> &'static str {
    if media_type != "image" {
        return "unsupported";
    }

    let cache_path = thumbnail_cache_path_for_id(id);
    if cache_path.exists() {
        return "ready";
    }

    if thumbnails::can_generate_thumbnail(ext) {
        "missing"
    } else {
        "unsupported"
    }
}

/// Escanea los directorios locales de medios y registra archivos nuevos en la BD.
///
/// Recorre recursivamente los directorios devueltos por `get_scan_roots()`,
/// filtra por formatos soportados e inserta registros con estado inicial
/// (`discovery_status = 'found'`, demás estados en `'pending'`).
/// Usa `INSERT OR IGNORE` para no duplicar entradas existentes por `path`.
#[tauri::command]
pub async fn scan_local_media(pool: State<'_, SqlitePool>) -> Result<u32, String> {
    let roots = get_scan_roots();
    let mut inserted: u32 = 0;
    let mut scanned: u32 = 0;
    let mut skipped: u32 = 0;

    println!("[scan] Iniciando escaneo — {} raíces encontradas", roots.len());

    for root in &roots {
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

            let has_perm_int: i32 = if has_permission { 1 } else { 0 };

                        let id = Uuid::new_v4().to_string();
                        let thumb_status = scan_thumbnail_status(&id, media_type, ext);

                        let result = sqlx::query(
                "INSERT OR IGNORE INTO images (id, path, filename, directory, extension, media_type, size_bytes, modified_at, has_read_permission, discovery_status, metadata_status, thumbnail_status, face_status, geocode_status)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'found', 'pending', ?, 'pending', 'pending')"
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
            .bind(thumb_status)
            .execute(pool.inner())
            .await;

            match result {
                Ok(r) => {
                    if r.rows_affected() > 0 {
                        inserted += 1;
                    }
                }
                Err(e) => {
                    // Registrar el error pero no detener el escaneo
                    println!("[scan] ✗ Error al insertar {}: {}", path_str, e);
                }
            }
        }
    }

    println!("[scan] Escaneo finalizado — {} insertados, {} ya existentes, {} no soportados",
        inserted, scanned - inserted, skipped);

    Ok(inserted)
}

#[tauri::command]
pub async fn request_thumbnail(
    app: AppHandle,
    pool: State<'_, SqlitePool>,
    image_id: String,
) -> Result<(), String> {
    request_thumbnail_inner(&app, pool.inner(), &image_id).await
}

#[tauri::command]
pub async fn request_thumbnails_for_visible(
    app: AppHandle,
    pool: State<'_, SqlitePool>,
    ids: Vec<String>,
) -> Result<u32, String> {
    // Deduplicar y recortar para evitar rafagas grandes por scroll rápido.
    let mut deduped = std::collections::HashSet::new();
    let mut queue = Vec::new();
    for id in ids {
        if deduped.insert(id.clone()) {
            queue.push(id);
        }
        if queue.len() >= 32 {
            break;
        }
    }

    let mut processed = 0u32;
    for id in &queue {
        request_thumbnail_inner(&app, pool.inner(), id).await?;
        processed += 1;
    }

    Ok(processed)
}

async fn request_thumbnail_inner(
    app: &AppHandle,
    pool: &SqlitePool,
    image_id: &str,
) -> Result<(), String> {
    let row = sqlx::query_as::<_, DbThumbnailTarget>(
        "SELECT id, path, extension, thumbnail_status FROM images WHERE id = ? LIMIT 1",
    )
    .bind(image_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| format!("Error al consultar medio {}: {}", image_id, e))?;

    let target = match row {
        Some(r) => r,
        None => return Err(format!("Medio no encontrado: {}", image_id)),
    };

    if matches!(target.thumbnail_status.as_deref(), Some("queued") | Some("processing")) {
        return Ok(());
    }

    let cache_path = thumbnail_cache_path_for_id(&target.id);
    if cache_path.exists() {
        let cache = cache_path.to_string_lossy().to_string();
        sqlx::query(
            "UPDATE images SET thumbnail_path = ?, thumbnail_status = 'ready', thumbnail_error = NULL WHERE id = ?",
        )
        .bind(&cache)
        .bind(&target.id)
        .execute(pool)
        .await
        .map_err(|e| format!("Error al marcar miniatura lista {}: {}", image_id, e))?;

        let _ = app.emit(
            "thumbnail-ready",
            ThumbnailReadyPayload {
                id: target.id,
                thumbnail_path: cache,
            },
        );
        return Ok(());
    }

    let ext = target.extension.unwrap_or_default();
    if !thumbnails::can_generate_thumbnail(&ext) {
        sqlx::query(
            "UPDATE images SET thumbnail_status = 'unsupported', thumbnail_error = NULL WHERE id = ?",
        )
        .bind(&target.id)
        .execute(pool)
        .await
        .map_err(|e| format!("Error al marcar unsupported {}: {}", image_id, e))?;
        return Ok(());
    }

    sqlx::query(
        "UPDATE images SET thumbnail_status = 'queued', thumbnail_error = NULL WHERE id = ?",
    )
    .bind(&target.id)
    .execute(pool)
    .await
    .map_err(|e| format!("Error al encolar miniatura {}: {}", image_id, e))?;

    let sem = thumbnail_semaphore();
    let permit = sem
        .acquire_owned()
        .await
        .map_err(|e| format!("Error de semáforo para {}: {}", image_id, e))?;

    sqlx::query(
        "UPDATE images SET thumbnail_status = 'processing' WHERE id = ?",
    )
    .bind(&target.id)
    .execute(pool)
    .await
    .map_err(|e| format!("Error al marcar processing {}: {}", image_id, e))?;

    let source_path = PathBuf::from(&target.path);
    let generated = thumbnails::generate_and_update(pool, &source_path, &target.id, &ext).await;

    drop(permit);

    if let Some(path) = generated {
        let _ = app.emit(
            "thumbnail-ready",
            ThumbnailReadyPayload {
                id: target.id,
                thumbnail_path: path,
            },
        );
    }

    Ok(())
}

/// Devuelve el listado completo de imágenes/videos desde la base de datos.
///
/// Ordena por `added_at` descendente (los más recientes primero).
#[tauri::command]
pub async fn get_all_images(pool: State<'_, SqlitePool>) -> Result<Vec<Image>, String> {
    sqlx::query_as::<_, Image>(
        "SELECT * FROM images WHERE has_read_permission = 1 AND is_deleted = 0 ORDER BY added_at DESC",
    )
        .fetch_all(pool.inner())
        .await
        .map_err(|e| format!("Error al obtener imágenes: {}", e))
}
