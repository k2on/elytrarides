ALTER TABLE reservations
DROP COLUMN is_cancelled,
DROP COLUMN is_complete,
DROP COLUMN complete_at,
DROP COLUMN stops,
DROP COLUMN is_dropoff,
DROP COLUMN is_driver_arrived,
DROP COLUMN driver_arrived_at,
DROP COLUMN est_pickup,
DROP COLUMN est_dropoff,
ADD COLUMN status INT NOT NULL,
ADD COLUMN driver_assigned_at INT,
ADD COLUMN initial_passenger_count INT NOT NULL,
ADD COLUMN actual_passenger_count_given_at INT;

CREATE TABLE reservation_stops (
    id UUID PRIMARY KEY,
    id_reservation UUID NOT NULL,
    stop_order INT NOT NULL,
    eta INT NOT NULL,
    created_at INT NOT NULL,
    updated_at INT,
    complete_at INT,
    driver_arrived_at INT,

    is_event_location BOOLEAN NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    lat_address DOUBLE PRECISION NOT NULL,
    lng_address DOUBLE PRECISION NOT NULL,
    address_main TEXT NOT NULL,
    address_sub TEXT NOT NULL,
    place_id TEXT
);
