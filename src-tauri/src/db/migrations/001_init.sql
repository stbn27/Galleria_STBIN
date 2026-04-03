CREATE TABLE IF NOT EXISTS images (
    id                    TEXT PRIMARY KEY,
    path                  TEXT NOT NULL UNIQUE,
    filename              TEXT NOT NULL,
    directory             TEXT NOT NULL,
    extension             TEXT,
    mime_type             TEXT,
    media_type            TEXT NOT NULL DEFAULT 'image', -- image | video

    file_hash             TEXT,   -- hash estable del archivo para identidad persistente
    binary_hash           TEXT,   -- hash binario para detectar duplicados exactos
    perceptual_hash       TEXT,   -- hash visual para comparación aproximada
    source_image_id       TEXT REFERENCES images(id) ON DELETE SET NULL,

    size_bytes            INTEGER,
    width                 INTEGER,
    height                INTEGER,
    duration_ms           INTEGER,
    frame_rate            REAL,

    taken_at              DATETIME,
    added_at              DATETIME DEFAULT CURRENT_TIMESTAMP,
    modified_at           DATETIME,
    last_scanned_at       DATETIME,

    camera_make           TEXT,
    camera_model          TEXT,
    focal_length          TEXT,
    aperture              TEXT,
    iso                   INTEGER,
    orientation           INTEGER,

    latitude              REAL,
    longitude             REAL,
    altitude              REAL,
    location_name         TEXT,

    thumbnail_path        TEXT,
    preview_path          TEXT,

    is_favorite           INTEGER DEFAULT 0,
    is_deleted            INTEGER DEFAULT 0,
    deleted_at            DATETIME,
    is_corrupted          INTEGER DEFAULT 0,
    has_read_permission   INTEGER DEFAULT 1,

    applied_rotation      INTEGER DEFAULT 0,

    discovery_status      TEXT DEFAULT 'found',      -- found | unreadable | skipped | missing
    metadata_status       TEXT DEFAULT 'pending',    -- pending | processing | done | error
    thumbnail_status      TEXT DEFAULT 'pending',    -- pending | processing | done | error
    face_status           TEXT DEFAULT 'pending',    -- pending | processing | done | error | stale
    geocode_status        TEXT DEFAULT 'pending',    -- pending | processing | done | error | cached

    metadata_error        TEXT,
    thumbnail_error       TEXT,
    face_error            TEXT,
    geocode_error         TEXT
);

CREATE INDEX IF NOT EXISTS idx_images_directory ON images(directory);
CREATE INDEX IF NOT EXISTS idx_images_taken_at ON images(taken_at);
CREATE INDEX IF NOT EXISTS idx_images_favorite ON images(is_favorite);
CREATE INDEX IF NOT EXISTS idx_images_deleted ON images(is_deleted);
CREATE INDEX IF NOT EXISTS idx_images_media_type ON images(media_type);
CREATE INDEX IF NOT EXISTS idx_images_file_hash ON images(file_hash);
CREATE INDEX IF NOT EXISTS idx_images_binary_hash ON images(binary_hash);
CREATE INDEX IF NOT EXISTS idx_images_perceptual_hash ON images(perceptual_hash);
CREATE INDEX IF NOT EXISTS idx_images_face_status ON images(face_status);
CREATE INDEX IF NOT EXISTS idx_images_thumbnail_status ON images(thumbnail_status);
CREATE INDEX IF NOT EXISTS idx_images_geocode_status ON images(geocode_status);
