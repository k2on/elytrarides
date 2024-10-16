ALTER TABLE reservations
ADD COLUMN is_cancelled BOOLEAN NOT NULL,
ADD COLUMN is_complete BOOLEAN NOT NULL,
ADD COLUMN complete_at INT,
ADD COLUMN stops TEXT NOT NULL,
ADD COLUMN is_dropoff BOOLEAN NOT NULL,
ADD COLUMN is_driver_arrived BOOLEAN NOT NULL,
ADD COLUMN driver_arrived_at INT,
ADD COLUMN est_pickup INT,
ADD COLUMN est_dropoff INT,
DROP COLUMN status,
DROP COLUMN driver_assigned_at,
DROP COLUMN initial_passenger_count,
DROP COLUMN actual_passenger_count_given_at;

DROP TABLE reservation_stops;
