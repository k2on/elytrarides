CREATE TABLE colleges (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT NOT NULL,
    location_lat DOUBLE PRECISION NOT NULL,
    location_lng DOUBLE PRECISION NOT NULL,
    created_at INT NOT NULL,
    removed_at INT
);
ALTER TABLE orgs
ADD COLUMN college UUID,
DROP COLUMN university;
