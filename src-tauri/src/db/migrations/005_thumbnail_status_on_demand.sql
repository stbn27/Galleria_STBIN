-- Migracion de estados de miniaturas para estrategia on-demand.
-- pending -> missing
-- done -> ready
-- formatos no procesables -> unsupported

UPDATE images
SET thumbnail_status = 'missing'
WHERE thumbnail_status = 'pending'
  AND thumbnail_path IS NULL;

UPDATE images
SET thumbnail_status = 'ready'
WHERE thumbnail_status = 'done'
  AND thumbnail_path IS NOT NULL;

UPDATE images
SET thumbnail_status = 'error'
WHERE thumbnail_status = 'done'
  AND thumbnail_path IS NULL
  AND thumbnail_error IS NOT NULL;

UPDATE images
SET thumbnail_status = 'unsupported'
WHERE media_type = 'image'
  AND lower(COALESCE(extension, '')) IN ('svg', 'heic', 'raw')
  AND thumbnail_path IS NULL;

UPDATE images
SET thumbnail_status = 'unsupported'
WHERE media_type = 'video'
  AND thumbnail_path IS NULL;

UPDATE images
SET thumbnail_status = 'missing'
WHERE thumbnail_status NOT IN ('missing', 'queued', 'processing', 'ready', 'error', 'unsupported')
  AND thumbnail_path IS NULL;
