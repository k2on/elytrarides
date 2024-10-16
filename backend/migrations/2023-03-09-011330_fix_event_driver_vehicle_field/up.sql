ALTER TABLE event_drivers
ALTER COLUMN "id_vehicle" TYPE int USING "id_vehicle"::int;