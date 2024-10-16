ALTER TABLE reservations
DROP COLUMN driver,
DROP COLUMN id_vehicle,
ADD COLUMN id_driver INT;