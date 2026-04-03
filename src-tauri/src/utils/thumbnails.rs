use std::path::{Path, PathBuf};
use sqlx::SqlitePool;

use crate::utils::paths::get_thumbnails_dir;

/// Tamaño máximo de la miniatura (ancho o alto).
const THUMBNAIL_SIZE: u32 = 400;

/// Extensiones de imagen que se pueden procesar con el crate `image`.
/// SVG, HEIC, RAW no son soportados nativamente por `image`.
const PROCESSABLE_EXTENSIONS: &[&str] = &[
    "png", "jpg", "jpeg", "webp", "gif", "tiff", "tif", "ico",
];

/// Asegura que el directorio de miniaturas exista.
pub fn ensure_thumbnails_dir() -> Result<PathBuf, String> {
    let dir = get_thumbnails_dir();
    if !dir.exists() {
        std::fs::create_dir_all(&dir)
            .map_err(|e| format!("Error al crear directorio de miniaturas {:?}: {}", dir, e))?;
    }
    Ok(dir)
}

/// Verifica si una extensión puede generar miniatura con el crate `image`.
pub fn can_generate_thumbnail(ext: &str) -> bool {
    PROCESSABLE_EXTENSIONS.contains(&ext.to_lowercase().as_str())
}

/// Genera una miniatura para una imagen y la guarda en `data/thumbnails/{id}.jpg`.
///
/// Redimensiona la imagen manteniendo la proporción al tamaño más grande
/// que quepa en un cuadro de `THUMBNAIL_SIZE x THUMBNAIL_SIZE` píxeles.
/// Retorna la ruta absoluta a la miniatura generada.
pub fn generate_thumbnail(image_path: &Path, id: &str) -> Result<PathBuf, String> {
    let thumbnails_dir = ensure_thumbnails_dir()?;
    let thumb_path = thumbnails_dir.join(format!("{}.jpg", id));

    // Si ya existe, no regenerar
    if thumb_path.exists() {
        return Ok(thumb_path);
    }

    // Abrir imagen
    let img = image::open(image_path)
        .map_err(|e| format!("Error al abrir imagen {:?}: {}", image_path, e))?;

    // Redimensionar manteniendo proporción (thumbnail = fit dentro de 400x400)
    let thumb = img.thumbnail(THUMBNAIL_SIZE, THUMBNAIL_SIZE);

    // Guardar como JPEG con calidad 85
    thumb
        .save(&thumb_path)
        .map_err(|e| format!("Error al guardar miniatura {:?}: {}", thumb_path, e))?;

    Ok(thumb_path)
}

/// Genera la miniatura y actualiza la BD con el resultado.
///
/// Si tiene éxito, actualiza `thumbnail_path` y `thumbnail_status = 'ready'`
/// y retorna `Some(ruta_miniatura)`.
/// Si falla, registra el error en `thumbnail_error` y `thumbnail_status = 'error'`
/// y retorna `None`.
pub async fn generate_and_update(
    pool: &SqlitePool,
    image_path: &Path,
    id: &str,
    ext: &str,
) -> Option<String> {
    if !can_generate_thumbnail(ext) {
        // Para formatos no soportados (SVG, HEIC, RAW), omitir silenciosamente.
        return None;
    }

    // Clonar datos para el bloque bloqueante
    let img_path = image_path.to_path_buf();
    let image_id = id.to_string();

    // Ejecutar la generación en un hilo bloqueante para no pausar el async runtime
    let result = tokio::task::spawn_blocking(move || {
        generate_thumbnail(&img_path, &image_id)
    })
    .await;

    match result {
        Ok(Ok(thumb_path)) => {
            let thumb_str = thumb_path.to_string_lossy().to_string();
            let _ = sqlx::query(
                "UPDATE images SET thumbnail_path = ?, thumbnail_status = 'ready', thumbnail_error = NULL WHERE id = ?"
            )
            .bind(&thumb_str)
            .bind(id)
            .execute(pool)
            .await;
            Some(thumb_str)
        }
        Ok(Err(e)) => {
            println!("[thumbnails] ✗ Error para {}: {}", id, e);
            let _ = sqlx::query(
                "UPDATE images SET thumbnail_status = 'error', thumbnail_error = ? WHERE id = ?"
            )
            .bind(&e)
            .bind(id)
            .execute(pool)
            .await;
            None
        }
        Err(e) => {
            println!("[thumbnails] ✗ Error de tarea para {}: {}", id, e);
            let err_msg = format!("Error de tarea: {}", e);
            let _ = sqlx::query(
                "UPDATE images SET thumbnail_status = 'error', thumbnail_error = ? WHERE id = ?"
            )
            .bind(&err_msg)
            .bind(id)
            .execute(pool)
            .await;
            None
        }
    }
}
