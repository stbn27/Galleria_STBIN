-- Agrega indice para discovery_status sin modificar migraciones historicas.

CREATE INDEX IF NOT EXISTS idx_images_discovery_status ON images(discovery_status);
