CREATE TABLE user_groups (
    id UUID PRIMARY KEY,
    id_org UUID NOT NULL,
    label TEXT NOT NULL,
    color TEXT NOT NULL,
    created_by TEXT NOT NULL,
    updated_by TEXT,
    created_at INT NOT NULL,
    updated_at INT,
    removed_at INT
);
CREATE TABLE user_group_memberships (
    id SERIAL PRIMARY KEY,
    id_org UUID NOT NULL,
    id_group UUID NOT NULL,
    phone TEXT NOT NULL,
    created_at INT NOT NULL,
    created_by TEXT NOT NULL,
    removed_at INT,
    removed_by TEXT
);
ALTER TABLE user_group_memberships
ADD CONSTRAINT id_group_phone_unique UNIQUE (id_group, phone);
