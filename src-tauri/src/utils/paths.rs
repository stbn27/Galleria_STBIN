use std::path::PathBuf;

/// Directorios internos que deben excluirse del escaneo.
const EXCLUDED_DIRS: &[&str] = &[
    "data", ".data", "logs", "node_modules", "target",
    "src", "src-tauri", ".git", ".agents", "scripts",
    "sidecar", "gen", "assets", ".gemini",
];

/// Obtiene el directorio raíz de la aplicación (directorio del proyecto).
/// En modo desarrollo, sube un nivel desde `src-tauri/` al root del proyecto.
/// En producción, usa el directorio del ejecutable.
pub fn get_root_dir() -> PathBuf {
    if cfg!(debug_assertions) {
        // En dev, el CWD es src-tauri/. Subimos un nivel al root del proyecto.
        let cwd = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
        let root = cwd.parent().unwrap_or(&cwd).to_path_buf();
        println!("[paths] Modo desarrollo — CWD: {:?}", cwd);
        println!("[paths] Raíz del proyecto resuelta: {:?}", root);
        root
    } else {
        let exe_dir = std::env::current_exe()
            .ok()
            .and_then(|p| p.parent().map(|p| p.to_path_buf()))
            .unwrap_or_else(|| PathBuf::from("."));
        println!("[paths] Modo producción — directorio del ejecutable: {:?}", exe_dir);
        exe_dir
    }
}

/// Obtiene la ruta al directorio de datos portable.
pub fn get_data_dir() -> PathBuf {
    get_root_dir().join("data")
}

/// Obtiene la ruta a la base de datos SQLite.
pub fn get_db_path() -> PathBuf {
    get_data_dir().join("curator.db")
}

/// Obtiene la ruta al directorio de miniaturas.
pub fn get_thumbnails_dir() -> PathBuf {
    get_data_dir().join("thumbnails")
}

/// Obtiene la ruta al directorio de recortes de rostros.
pub fn get_faces_dir() -> PathBuf {
    get_data_dir().join("faces")
}

/// Obtiene la ruta al directorio de logs.
pub fn get_logs_dir() -> PathBuf {
    get_data_dir().join("logs")
}

/// Obtiene la ruta al directorio de caché de geocodificación.
pub fn get_geo_cache_dir() -> PathBuf {
    get_data_dir().join("geo_cache")
}

/// Obtiene la ruta al directorio de la papelera.
pub fn get_trash_dir() -> PathBuf {
    get_data_dir().join("trash")
}

/// Devuelve los directorios raíz que deben escanearse.
///
/// Incluye los subdirectorios directos del root que no estén excluidos,
/// filtrando carpetas internas del sistema, binarios y datos.
pub fn get_scan_roots() -> Vec<PathBuf> {
    let root = get_root_dir();
    let mut roots = Vec::new();

    println!("[scan_roots] Buscando subdirectorios en: {:?}", root);

    match std::fs::read_dir(&root) {
        Ok(entries) => {
            for entry in entries.flatten() {
                let path = entry.path();
                if !path.is_dir() {
                    continue;
                }
                let dir_name = match path.file_name().and_then(|n| n.to_str()) {
                    Some(name) => name.to_string(),
                    None => continue,
                };
                // Excluir directorios internos
                if EXCLUDED_DIRS.iter().any(|&ex| dir_name.to_lowercase() == ex) {
                    println!("[scan_roots]   Excluido (interno): {}", dir_name);
                    continue;
                }
                // Excluir directorios ocultos (empiezan con .)
                if dir_name.starts_with('.') {
                    println!("[scan_roots]   Excluido (oculto): {}", dir_name);
                    continue;
                }
                println!("[scan_roots]   ✓ Incluido: {:?}", path);
                roots.push(path);
            }
        }
        Err(e) => {
            println!("[scan_roots] ERROR al leer directorio {:?}: {}", root, e);
        }
    }

    println!("[scan_roots] Total de raíces de escaneo: {}", roots.len());
    roots
}
