-- Add favorite support to sessions
ALTER TABLE sessions ADD COLUMN is_favorite BOOLEAN DEFAULT 0;
ALTER TABLE sessions ADD COLUMN favorite_pinned_at DATETIME;
UPDATE sessions
SET favorite_pinned_at = created_at
WHERE is_favorite = 1 AND favorite_pinned_at IS NULL;
