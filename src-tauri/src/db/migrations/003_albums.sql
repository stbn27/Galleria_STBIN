CREATE TABLE IF NOT EXISTS albums (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    description     TEXT,
    album_type      TEXT DEFAULT 'manual', -- manual | smart_face | smart_location | smart_date | favorites
    cover_image_id  TEXT REFERENCES images(id) ON DELETE SET NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    smart_filter    TEXT
);

CREATE TABLE IF NOT EXISTS album_images (
    album_id        TEXT NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
    image_id        TEXT NOT NULL REFERENCES images(id) ON DELETE CASCADE,
    added_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (album_id, image_id)
);

CREATE INDEX IF NOT EXISTS idx_album_images_album ON album_images(album_id);
CREATE INDEX IF NOT EXISTS idx_album_images_image ON album_images(image_id);

INSERT OR IGNORE INTO albums (id, name, album_type)
VALUES ('favorites-album-id', 'Favoritos', 'favorites');
