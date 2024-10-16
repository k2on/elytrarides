ALTER TABLE reservations
ADD COLUMN driver TEXT,
ADD COLUMN id_vehicle INT NOT NULL,
DROP COLUMN id_driver;