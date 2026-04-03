CREATE TABLE IF NOT EXISTS jobs (
    id                TEXT PRIMARY KEY,
    job_type          TEXT NOT NULL, -- scan | thumbnail | faces | geocode | reindex | duplicate_check
    scope_type        TEXT NOT NULL, -- image | directory | all
    scope_value       TEXT,
    status            TEXT NOT NULL DEFAULT 'queued', -- queued | running | done | error | cancelled
    progress_current  INTEGER DEFAULT 0,
    progress_total    INTEGER DEFAULT 0,
    started_at        DATETIME,
    finished_at       DATETIME,
    retry_count       INTEGER DEFAULT 0,
    error_message     TEXT,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_logs (
    id                TEXT PRIMARY KEY,
    job_id            TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    level             TEXT NOT NULL, -- info | warn | error
    message           TEXT NOT NULL,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reverse_geocode_cache (
    id                TEXT PRIMARY KEY,
    latitude          REAL NOT NULL,
    longitude         REAL NOT NULL,
    location_name     TEXT NOT NULL,
    raw_json          TEXT,
    source            TEXT DEFAULT 'nominatim',
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(latitude, longitude)
);

CREATE TABLE IF NOT EXISTS settings (
    key               TEXT PRIMARY KEY,
    value             TEXT NOT NULL,
    updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP
);
