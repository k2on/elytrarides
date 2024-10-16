CREATE TABLE points (
    id SERIAL PRIMARY KEY,
    org INT NOT NULL,
    amount INT NOT NULL,
    sender TEXT NOT NULL,
    recipient TEXT NOT NULL,
    timestamp INT NOT NULL,
    request INT,
    description TEXT NOT NULL,
    is_revoked BOOLEAN NOT NULL
);
CREATE TABLE points_request (
    id SERIAL PRIMARY KEY,
    org INT NOT NULL,
    amount INT NOT NULL,
    poster TEXT NOT NULL,
    timestamp INT NOT NULL,
    timestamp_deadline INT,
    description TEXT NOT NULL,
    people INT NOT NULL,
    is_complete BOOLEAN NOT NULL,
    is_removed BOOLEAN NOT NULL
);
CREATE TABLE points_assignment (
    id SERIAL PRIMARY KEY,
    org INT NOT NULL,
    request INT NOT NULL,
    assignee TEXT NOT NULL,
    timestamp INT NOT NULL,
    is_cancelled BOOLEAN NOT NULL
)