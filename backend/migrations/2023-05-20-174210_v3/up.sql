ALTER TABLE reservations
DROP COLUMN location_lat,
DROP COLUMN location_lng,
DROP COLUMN driver_connection_made_at,
DROP COLUMN address,
DROP COLUMN duration,
DROP COLUMN is_collected,
DROP COLUMN collected_at,
ADD COLUMN stops TEXT NOT NULL,
ADD COLUMN is_dropoff BOOLEAN NOT NULL;