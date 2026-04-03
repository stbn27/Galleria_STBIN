use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use std::collections::HashMap;
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
pub async fn get_directory_media(
    pool: State<'_, SqlitePool>,
    directory: String,
) -> Result<Vec<Image>, String> {
    crate::db::queries::get_images_by_directory(&pool, &directory)
        .await
        .map_err(|e| e.to_string())
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
