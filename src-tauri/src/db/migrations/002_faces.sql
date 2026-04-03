CREATE TABLE IF NOT EXISTS persons (
    id              TEXT PRIMARY KEY,
    name            TEXT,
    is_owner        INTEGER DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    cover_face_id   TEXT,
    merged_into_id  TEXT REFERENCES persons(id) ON DELETE SET NULL,
    notes           TEXT
);

CREATE TABLE IF NOT EXISTS faces (
    id              TEXT PRIMARY KEY,
    image_id        TEXT NOT NULL REFERENCES images(id) ON DELETE CASCADE,
    person_id       TEXT REFERENCES persons(id) ON DELETE SET NULL,

    bbox_x          REAL NOT NULL,
    bbox_y          REAL NOT NULL,
    bbox_w          REAL NOT NULL,
    bbox_h          REAL NOT NULL,

    confidence      REAL,
    embedding       TEXT,
    thumbnail_path  TEXT,

    detection_source TEXT DEFAULT 'auto', -- auto | manual
    status          TEXT DEFAULT 'detected', -- detected | confirmed | rejected | merged | ignored
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS face_suggestions (
    id              TEXT PRIMARY KEY,
    face_id         TEXT NOT NULL REFERENCES faces(id) ON DELETE CASCADE,
    suggested_person_id TEXT REFERENCES persons(id) ON DELETE CASCADE,
    similarity      REAL NOT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    dismissed       INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_faces_image ON faces(image_id);
CREATE INDEX IF NOT EXISTS idx_faces_person ON faces(person_id);
CREATE INDEX IF NOT EXISTS idx_face_suggestions_face ON face_suggestions(face_id);
