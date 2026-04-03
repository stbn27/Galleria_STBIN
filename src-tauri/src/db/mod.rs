use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
use std::path::Path;

pub mod schema;
pub mod queries;

pub async fn init_db<P: AsRef<Path>>(db_path: P) -> anyhow::Result<SqlitePool> {
    let path = db_path.as_ref();
    
    // Crear el directorio padre si no existe
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            std::fs::create_dir_all(parent)?;
        }
    }

    let db_url = format!("sqlite:{}?mode=rwc", path.display());

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await?;

    // Ejecutar migraciones
    sqlx::migrate!("./src/db/migrations")
        .run(&pool)
        .await?;

    Ok(pool)
}
