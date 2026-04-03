// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let data_dir = std::path::Path::new("data");
            let db_path = data_dir.join("curator.db");
            
            let pool = tauri::async_runtime::block_on(async move {
                db::init_db(&db_path).await.expect("Failed to initialize database")
            });
            
            app.manage(pool);
            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
