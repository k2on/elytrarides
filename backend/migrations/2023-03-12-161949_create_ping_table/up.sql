CREATE TABLE pings (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL,
    phone TEXT NOT NULL,
    location_lat DOUBLE PRECISION NOT NULL,
    location_lng DOUBLE PRECISION NOT NULL,
    timestamp INT NOT NULL
)