CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    id_event TEXT NOT NULL,
    made_at INT NOT NULL,
    reserver TEXT NOT NULL,
    passenger_count INT NOT NULL,
    location_lat DOUBLE PRECISION NOT NULL,
    location_lng DOUBLE PRECISION NOT NULL,
    is_cancelled BOOLEAN DEFAULT FALSE NOT NULL,
    is_complete BOOLEAN DEFAULT FALSE NOT NULL,
    driver TEXT,
    driver_connection_made_at INT
)