CREATE TABLE media (
    id UUID PRIMARY KEY,
    uploader TEXT NOT NULL,
    id_org UUID,
    media_type TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at INT NOT NULL,
    removed_at INT
);
