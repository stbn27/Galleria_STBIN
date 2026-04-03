use sqlx::{SqlitePool, Error};
use super::schema::Image;

/// Obtiene medios pendientes de miniatura
pub async fn get_pending_thumbnails(pool: &SqlitePool) -> Result<Vec<Image>, Error> {
    sqlx::query_as::<_, Image>("SELECT * FROM images WHERE thumbnail_status = 'pending'")
        .fetch_all(pool)
        .await
}

/// Obtiene medios pendientes de detección facial
pub async fn get_pending_faces(pool: &SqlitePool) -> Result<Vec<Image>, Error> {
    sqlx::query_as::<_, Image>("SELECT * FROM images WHERE face_status = 'pending'")
        .fetch_all(pool)
        .await
}

/// Obtiene medios con rostros desactualizados (`stale`)
pub async fn get_stale_faces(pool: &SqlitePool) -> Result<Vec<Image>, Error> {
    sqlx::query_as::<_, Image>("SELECT * FROM images WHERE face_status = 'stale'")
        .fetch_all(pool)
        .await
}

/// Obtiene medios corruptos
pub async fn get_corrupted_media(pool: &SqlitePool) -> Result<Vec<Image>, Error> {
    sqlx::query_as::<_, Image>("SELECT * FROM images WHERE is_corrupted = 1")
        .fetch_all(pool)
        .await
}

/// Obtiene medios sin permiso de lectura
pub async fn get_no_permission_media(pool: &SqlitePool) -> Result<Vec<Image>, Error> {
    sqlx::query_as::<_, Image>("SELECT * FROM images WHERE has_read_permission = 0")
        .fetch_all(pool)
        .await
}

/// Obtiene candidatos a duplicados agrupados por `binary_hash` o `perceptual_hash`
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
