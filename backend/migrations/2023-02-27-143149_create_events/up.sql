CREATE TABLE events (
    code TEXT PRIMARY KEY, 
    id_org INT NOT NULL,
    name TEXT NOT NULL,
    bio TEXT,
    image_url TEXT,
    id_location INT NOT NULL,
    time_start INT NOT NULL,
    time_end INT NOT NULL,
    reservations_start INT NOT NULL,
    reservations_end INT NOT NULL
)