use sqlx::SqlitePool;
use tauri::State;
use uuid::Uuid;
use walkdir::WalkDir;

use crate::db::schema::Image;
use crate::utils::paths::get_scan_roots;
use crate::utils::thumbnails;

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
pub async fn scan_local_media(pool: State<'_, SqlitePool>) -> Result<u32, String> {
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

                        // Generar miniatura para imágenes recién insertadas
                        if media_type == "image" {
                            thumbnails::generate_and_update(
                                pool.inner(),
                                path,
                                &id,
                                ext,
                            ).await;
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
