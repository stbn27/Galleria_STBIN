use sqlx::{Error, SqlitePool};
use super::schema::Image;

#[derive(Debug, sqlx::FromRow)]
pub struct DirectoryPreviewRow {
    pub directory: String,
    pub id: String,
    pub path: String,
    pub thumbnail_path: Option<String>,
    pub media_type: String,
}

/// Obtiene medios cuyas miniaturas aún no se han solicitado.
#[allow(dead_code)]
pub async fn get_missing_thumbnails(pool: &SqlitePool) -> Result<Vec<Image>, Error> {
    sqlx::query_as::<_, Image>(
        "SELECT * FROM images
         WHERE media_type = 'image'
           AND thumbnail_status = 'missing'
           AND has_read_permission = 1",
    )
        .fetch_all(pool)
        .await
}

/// Obtiene medios con miniaturas en cola o en procesamiento.
#[allow(dead_code)]
pub async fn get_active_thumbnail_jobs(pool: &SqlitePool) -> Result<Vec<Image>, Error> {
    sqlx::query_as::<_, Image>(
        "SELECT * FROM images
         WHERE media_type = 'image'
           AND thumbnail_status IN ('queued', 'processing')",
    )
    .fetch_all(pool)
    .await
}

/// Obtiene medios sin soporte de miniaturas para evitar loops de reproceso.
#[allow(dead_code)]
pub async fn get_unsupported_thumbnails(pool: &SqlitePool) -> Result<Vec<Image>, Error> {
    sqlx::query_as::<_, Image>(
        "SELECT * FROM images
         WHERE media_type = 'image'
           AND thumbnail_status = 'unsupported'",
    )
    .fetch_all(pool)
    .await
}

/// Obtiene medios pendientes de detección facial
#[allow(dead_code)]
pub async fn get_pending_faces(pool: &SqlitePool) -> Result<Vec<Image>, Error> {
    sqlx::query_as::<_, Image>("SELECT * FROM images WHERE face_status = 'pending'")
        .fetch_all(pool)
        .await
}

/// Obtiene medios con rostros desactualizados (`stale`)
#[allow(dead_code)]
pub async fn get_stale_faces(pool: &SqlitePool) -> Result<Vec<Image>, Error> {
    sqlx::query_as::<_, Image>("SELECT * FROM images WHERE face_status = 'stale'")
        .fetch_all(pool)
        .await
}

/// Obtiene medios corruptos
#[allow(dead_code)]
pub async fn get_corrupted_media(pool: &SqlitePool) -> Result<Vec<Image>, Error> {
    sqlx::query_as::<_, Image>("SELECT * FROM images WHERE is_corrupted = 1")
        .fetch_all(pool)
        .await
}

/// Obtiene medios sin permiso de lectura
#[allow(dead_code)]
pub async fn get_no_permission_media(pool: &SqlitePool) -> Result<Vec<Image>, Error> {
    sqlx::query_as::<_, Image>("SELECT * FROM images WHERE has_read_permission = 0")
        .fetch_all(pool)
        .await
}

/// Obtiene candidatos a duplicados agrupados por `binary_hash` o `perceptual_hash`
#[allow(dead_code)]
pub async fn get_duplicate_candidates(pool: &SqlitePool) -> Result<Vec<Image>, Error> {
    // Retorna todos los que compartan hash con al menos otro
    sqlx::query_as::<_, Image>(
        "SELECT * FROM images 
         WHERE binary_hash IN (
             SELECT binary_hash FROM images WHERE binary_hash IS NOT NULL GROUP BY binary_hash HAVING COUNT(*) > 1
         ) 
         OR perceptual_hash IN (
             SELECT perceptual_hash FROM images WHERE perceptual_hash IS NOT NULL GROUP BY perceptual_hash HAVING COUNT(*) > 1
         )"
    )
    .fetch_all(pool)
    .await
}

/// Asegurar que solo exista una persona con `is_owner = 1`
#[allow(dead_code)]
pub async fn ensure_single_owner(pool: &SqlitePool, owner_id: &str) -> Result<(), Error> {
    let mut tx = pool.begin().await?;
    
    // Quitar owner a todos
    sqlx::query("UPDATE persons SET is_owner = 0 WHERE is_owner = 1")
        .execute(&mut *tx)
        .await?;
        
    // Asignar al nuevo
    sqlx::query("UPDATE persons SET is_owner = 1 WHERE id = ?")
        .bind(owner_id)
        .execute(&mut *tx)
        .await?;
        
    tx.commit().await?;
    Ok(())
}

/// Obtiene el árbol de directorios con sus conteos
pub async fn get_directory_stats(pool: &SqlitePool) -> Result<Vec<(String, i64)>, Error> {
    sqlx::query_as::<_, (String, i64)>(
        "SELECT directory as dir, COUNT(id) as count FROM images 
         WHERE is_deleted = 0 AND is_corrupted = 0 AND has_read_permission = 1 
         GROUP BY directory 
         ORDER BY directory"
    )
    .fetch_all(pool)
    .await
}

/// Obtiene imágenes de un directorio
pub async fn get_images_by_directory(pool: &SqlitePool, directory: &str) -> Result<Vec<Image>, Error> {
    sqlx::query_as::<_, Image>(
        "SELECT * FROM images 
         WHERE directory = ? AND is_deleted = 0 AND has_read_permission = 1 
         ORDER BY taken_at DESC, added_at DESC"
    )
    .bind(directory)
    .fetch_all(pool)
    .await
}

/// Obtiene hasta 3 previews por directorio para sidebar visual.
pub async fn get_directory_previews(pool: &SqlitePool) -> Result<Vec<DirectoryPreviewRow>, Error> {
        sqlx::query_as::<_, DirectoryPreviewRow>(
                "SELECT directory, id, path, thumbnail_path, media_type
                 FROM (
                        SELECT directory,
                                     id,
                                     path,
                                     thumbnail_path,
                                     media_type,
                                     ROW_NUMBER() OVER (
                                         PARTITION BY directory
                                         ORDER BY COALESCE(taken_at, added_at, modified_at) DESC, id DESC
                                     ) AS rn
                        FROM images
                        WHERE is_deleted = 0
                            AND is_corrupted = 0
                            AND has_read_permission = 1
                 ) ranked
                 WHERE rn <= 3
                 ORDER BY directory, rn"
        )
        .fetch_all(pool)
        .await
}

