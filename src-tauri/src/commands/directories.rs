use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use std::collections::{HashMap, HashSet};
use std::path::{Component, Path};
use tauri::State;

use crate::db::schema::Image;

#[derive(Debug, Serialize, Deserialize)]
pub struct DirectoryNode {
    pub path: String,
    pub name: String,
    pub count: i64,
    pub children: Vec<DirectoryNode>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DirectoryPreviewItem {
    pub id: String,
    pub path: String,
    pub thumbnail_path: Option<String>,
    pub media_type: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DirectoryListItem {
    pub path: String,
    pub name: String,
    pub parent_path: Option<String>,
    pub media_count: i64,
    pub has_children: bool,
    pub child_count: i64,
    pub preview_items: Vec<DirectoryPreviewItem>,
    pub is_empty: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DirectorySummary {
    pub path: String,
    pub name: String,
    pub media_count: i64,
    pub image_count: i64,
    pub video_count: i64,
    pub thumbnail_ready: i64,
    pub thumbnail_processing: i64,
    pub thumbnail_missing: i64,
    pub thumbnail_error: i64,
}

#[derive(Debug)]
struct BuilderNode {
    path: String,
    name: String,
    count: i64,
    children: HashMap<String, BuilderNode>,
}

impl BuilderNode {
    fn to_directory_node(self) -> DirectoryNode {
        let mut children: Vec<DirectoryNode> = self.children
            .into_values()
            .map(|v| v.to_directory_node())
            .collect();
        // Sort by name
        children.sort_by(|a, b| a.name.cmp(&b.name));
        DirectoryNode {
            path: self.path,
            name: self.name,
            count: self.count,
            children,
        }
    }
}

// Helper to accumulate counts bubbling up from children
fn accumulate_counts(node: &mut BuilderNode) -> i64 {
    let mut sum = node.count;
    for child in node.children.values_mut() {
        sum += accumulate_counts(child);
    }
    node.count = sum;
    sum
}

fn get_parent_path(path: &str) -> Option<String> {
    if path == "/" {
        return None;
    }

    if let Some((parent, _)) = path.rsplit_once('/') {
        if parent.is_empty() {
            Some("/".to_string())
        } else {
            Some(parent.to_string())
        }
    } else {
        None
    }
}

fn get_display_name(path: &str) -> String {
    Path::new(path)
        .file_name()
        .map(|name| name.to_string_lossy().to_string())
        .filter(|name| !name.is_empty())
        .unwrap_or_else(|| path.to_string())
}

#[tauri::command]
pub async fn get_directories(pool: State<'_, SqlitePool>) -> Result<Vec<DirectoryNode>, String> {
    let stats = crate::db::queries::get_directory_stats(&pool)
        .await
        .map_err(|e| e.to_string())?;

    let mut root = BuilderNode {
        path: "".to_string(),
        name: "".to_string(),
        count: 0,
        children: HashMap::new(),
    };

    for (dir_path, count) in stats {
        let path = Path::new(&dir_path);
        let mut current_node = &mut root;
        let mut current_path = String::new();

        for component in path.components() {
            let comp_str = match component {
                Component::Prefix(p) => p.as_os_str().to_string_lossy().into_owned(),
                Component::RootDir => "/".to_string(),
                Component::CurDir => ".".to_string(),
                Component::ParentDir => "..".to_string(),
                Component::Normal(c) => c.to_string_lossy().into_owned(),
            };

            if current_path.is_empty() {
                current_path = comp_str.clone();
            } else if current_path == "/" {
                current_path = format!("/{comp_str}");
            } else {
                current_path = format!("{}/{}", current_path, comp_str);
            }

            let path_clone = current_path.clone();
            let name_clone = comp_str.clone();
            
            current_node = current_node.children.entry(comp_str).or_insert_with(|| BuilderNode {
                path: path_clone,
                name: name_clone,
                count: 0,
                children: HashMap::new(),
            });
        }
        current_node.count += count;
    }

    for child in root.children.values_mut() {
        accumulate_counts(child);
    }

    let mut result: Vec<DirectoryNode> = root.children
        .into_values()
        .map(|v| v.to_directory_node())
        .collect();

    result.sort_by(|a, b| a.name.cmp(&b.name));

    Ok(result)
}

#[tauri::command]
pub async fn get_directories_flat(pool: State<'_, SqlitePool>) -> Result<Vec<DirectoryListItem>, String> {
    let stats = crate::db::queries::get_directory_stats(&pool)
        .await
        .map_err(|e| e.to_string())?;

    let preview_rows = crate::db::queries::get_directory_previews(&pool)
        .await
        .map_err(|e| e.to_string())?;

    let mut preview_map: HashMap<String, Vec<DirectoryPreviewItem>> = HashMap::new();
    for row in preview_rows {
        preview_map
            .entry(row.directory)
            .or_default()
            .push(DirectoryPreviewItem {
                id: row.id,
                path: row.path,
                thumbnail_path: row.thumbnail_path,
                media_type: row.media_type,
            });
    }

    let mut children_map: HashMap<String, HashSet<String>> = HashMap::new();
    for (path, _) in &stats {
        if let Some(parent) = get_parent_path(path) {
            children_map
                .entry(parent)
                .or_default()
                .insert(path.clone());
        }
    }

    let mut directories: Vec<DirectoryListItem> = stats
        .into_iter()
        .map(|(path, media_count)| {
            let child_count = children_map
                .get(&path)
                .map(|set| set.len() as i64)
                .unwrap_or(0);

            DirectoryListItem {
                name: get_display_name(&path),
                parent_path: get_parent_path(&path),
                has_children: child_count > 0,
                child_count,
                preview_items: preview_map.remove(&path).unwrap_or_default(),
                is_empty: media_count <= 0,
                path,
                media_count,
            }
        })
        .collect();

    directories.sort_by(|a, b| {
        b.media_count
            .cmp(&a.media_count)
            .then(a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });

    Ok(directories)
}

#[tauri::command]
pub async fn get_directory_media(
    pool: State<'_, SqlitePool>,
    directory: String,
) -> Result<Vec<Image>, String> {
    crate::db::queries::get_images_by_directory(&pool, &directory)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_directory_summary(
    pool: State<'_, SqlitePool>,
    directory: String,
) -> Result<DirectorySummary, String> {
    let images = crate::db::queries::get_images_by_directory(&pool, &directory)
        .await
        .map_err(|e| e.to_string())?;

    let mut image_count = 0;
    let mut video_count = 0;
    let mut thumbnail_ready = 0;
    let mut thumbnail_processing = 0;
    let mut thumbnail_missing = 0;
    let mut thumbnail_error = 0;

    for media in &images {
        match media.media_type.as_str() {
            "video" => video_count += 1,
            _ => image_count += 1,
        }

        match media.thumbnail_status.as_deref() {
            Some("ready") => thumbnail_ready += 1,
            Some("queued") | Some("processing") => thumbnail_processing += 1,
            Some("missing") | Some("unsupported") => thumbnail_missing += 1,
            Some("error") => thumbnail_error += 1,
            _ => {}
        }
    }

    Ok(DirectorySummary {
        path: directory.clone(),
        name: get_display_name(&directory),
        media_count: images.len() as i64,
        image_count,
        video_count,
        thumbnail_ready,
        thumbnail_processing,
        thumbnail_missing,
        thumbnail_error,
    })
}

#[tauri::command]
pub async fn reanalyze_directory(directory: String) -> Result<String, String> {
    Ok(format!("Reanálisis encolado para: {directory}"))
}

#[tauri::command]
pub async fn reprocess_faces_in_directory(directory: String) -> Result<String, String> {
    Ok(format!("Reproceso de rostros encolado para: {directory}"))
}

#[tauri::command]
pub async fn rebuild_thumbnails_for_directory(directory: String) -> Result<String, String> {
    Ok(format!("Reconstrucción de miniaturas encolada para: {directory}"))
}

#[tauri::command]
pub async fn find_duplicates_in_directory(directory: String) -> Result<String, String> {
    Ok(format!("Búsqueda de duplicados encolada para: {directory}"))
}

// TODO: Placeholders for operational commands (e.g., delete_directory, move_directory)
#[tauri::command]
pub async fn delete_directory(
    _pool: State<'_, SqlitePool>,
    _directory: String,
) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub async fn move_directory(
    _pool: State<'_, SqlitePool>,
    _old_directory: String,
    _new_directory: String,
) -> Result<(), String> {
    Ok(())
}
