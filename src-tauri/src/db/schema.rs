use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct Image {
    pub id: String,
    pub path: String,
    pub filename: String,
    pub directory: String,
    pub extension: Option<String>,
    pub mime_type: Option<String>,
    pub media_type: String,

    pub file_hash: Option<String>,
    pub binary_hash: Option<String>,
    pub perceptual_hash: Option<String>,
    pub source_image_id: Option<String>,

    pub size_bytes: Option<i64>,
    pub width: Option<i64>,
    pub height: Option<i64>,
    pub duration_ms: Option<i64>,
    pub frame_rate: Option<f64>,

    pub taken_at: Option<DateTime<Utc>>,
    pub added_at: Option<DateTime<Utc>>,
    pub modified_at: Option<DateTime<Utc>>,
    pub last_scanned_at: Option<DateTime<Utc>>,

    pub camera_make: Option<String>,
    pub camera_model: Option<String>,
    pub focal_length: Option<String>,
    pub aperture: Option<String>,
    pub iso: Option<i64>,
    pub orientation: Option<i64>,

    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub altitude: Option<f64>,
    pub location_name: Option<String>,

    pub thumbnail_path: Option<String>,
    pub preview_path: Option<String>,

    pub is_favorite: Option<i64>,
    pub is_deleted: Option<i64>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub is_corrupted: Option<i64>,
    pub has_read_permission: Option<i64>,

    pub applied_rotation: Option<i64>,

    pub discovery_status: Option<String>,
    pub metadata_status: Option<String>,
    pub thumbnail_status: Option<String>,
    pub face_status: Option<String>,
    pub geocode_status: Option<String>,

    pub metadata_error: Option<String>,
    pub thumbnail_error: Option<String>,
    pub face_error: Option<String>,
    pub geocode_error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct Person {
    pub id: String,
    pub name: Option<String>,
    pub is_owner: Option<i64>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
    pub cover_face_id: Option<String>,
    pub merged_into_id: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct Face {
    pub id: String,
    pub image_id: String,
    pub person_id: Option<String>,
    pub bbox_x: f64,
    pub bbox_y: f64,
    pub bbox_w: f64,
    pub bbox_h: f64,
    pub confidence: Option<f64>,
    pub embedding: Option<String>,
    pub thumbnail_path: Option<String>,
    pub detection_source: Option<String>,
    pub status: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct FaceSuggestion {
    pub id: String,
    pub face_id: String,
    pub suggested_person_id: Option<String>,
    pub similarity: f64,
    pub created_at: Option<DateTime<Utc>>,
    pub dismissed: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct Album {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub album_type: Option<String>,
    pub cover_image_id: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
    pub smart_filter: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct AlbumImage {
    pub album_id: String,
    pub image_id: String,
    pub added_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct Job {
    pub id: String,
    pub job_type: String,
    pub scope_type: String,
    pub scope_value: Option<String>,
    pub status: String,
    pub progress_current: Option<i64>,
    pub progress_total: Option<i64>,
    pub started_at: Option<DateTime<Utc>>,
    pub finished_at: Option<DateTime<Utc>>,
    pub retry_count: Option<i64>,
    pub error_message: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct JobLog {
    pub id: String,
    pub job_id: String,
    pub level: String,
    pub message: String,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct ReverseGeocodeCache {
    pub id: String,
    pub latitude: f64,
    pub longitude: f64,
    pub location_name: String,
    pub raw_json: Option<String>,
    pub source: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct Setting {
    pub key: String,
    pub value: String,
    pub updated_at: Option<DateTime<Utc>>,
}
