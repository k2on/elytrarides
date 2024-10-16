CREATE TABLE members (
    id SERIAL PRIMARY KEY,
    id_org INT NOT NULL,
    phone TEXT NOT NULL,
    flags INT NOT NULL
);
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    id_org INT NOT NULL,
    year INT NOT NULL,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    color TEXT NOT NULL,
    image_url TEXT NOT NULL,
    license TEXT NOT NULL,
    is_removed BOOLEAN DEFAULT FALSE NOT NULL
);
CREATE TABLE event_drivers (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL,
    phone TEXT NOT NULL,
    id_vehicle TEXT NOT NULL
);
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    org_id INT NOT NULL,
    label TEXT NOT NULL,
    location_lat DOUBLE PRECISION NOT NULL,
    location_lng DOUBLE PRECISION NOT NULL,
    image_url TEXT NOT NULL
)