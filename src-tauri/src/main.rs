// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;
mod commands;
mod utils;

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let db_path = utils::paths::get_db_path();
            
            let pool = tauri::async_runtime::block_on(async move {
                db::init_db(&db_path).await.expect("Error al inicializar la base de datos")
            });
            
            // Asegurar que el directorio de miniaturas exista
            utils::thumbnails::ensure_thumbnails_dir()
                .expect("Error al crear directorio de miniaturas");

            app.manage(pool);
            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::images::scan_local_media,
            commands::images::get_all_images,
            commands::images::request_thumbnail,
            commands::images::request_thumbnails_for_visible,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
