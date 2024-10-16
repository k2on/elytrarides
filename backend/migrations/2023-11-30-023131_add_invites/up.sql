CREATE TABLE invites (
    id UUID PRIMARY KEY,
    id_org UUID NOT NULL,
    phone TEXT,
    created_at INT NOT NULL,
    revoked_at INT,
    created_by TEXT NOT NULL,
    revoked_by TEXT
);
