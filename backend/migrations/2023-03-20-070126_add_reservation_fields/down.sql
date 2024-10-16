ALTER TABLE reservations
DROP COLUMN is_collected,
DROP COLUMN collected_at,
DROP COLUMN cancelled_at,
DROP COLUMN complete_at;