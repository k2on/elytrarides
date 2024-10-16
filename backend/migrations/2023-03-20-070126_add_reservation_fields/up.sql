ALTER TABLE reservations
ADD COLUMN is_collected BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN collected_at INT,
ADD COLUMN complete_at INT,
ADD COLUMN cancelled_at INT;