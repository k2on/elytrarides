ALTER TABLE reservations
ADD COLUMN is_driver_arrived BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN driver_arrived_at INT;
