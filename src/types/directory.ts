export interface DirectoryNode {
    path: string;
    name: string;
    count: number;
    children: DirectoryNode[];
}

export interface DirectoryPreviewItem {
    id: string;
    path: string;
    thumbnail_path: string | null;
    media_type: 'image' | 'video';
}

export interface DirectoryListItem {
    path: string;
    name: string;
    parent_path: string | null;
    media_count: number;
    has_children: boolean;
    child_count: number;
    preview_items: DirectoryPreviewItem[];
    is_empty: boolean;
}

export interface DirectorySummary {
    path: string;
    name: string;
    media_count: number;
    image_count: number;
    video_count: number;
    thumbnail_ready: number;
    thumbnail_processing: number;
    thumbnail_missing: number;
    thumbnail_error: number;
}