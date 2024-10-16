ALTER TABLE locations DROP COLUMN id;
ALTER TABLE locations ADD COLUMN id UUID PRIMARY KEY;

ALTER TABLE locations DROP COLUMN org_id;
ALTER TABLE locations ADD COLUMN id_org UUID NOT NULL;

ALTER TABLE locations ADD COLUMN obsolete_at INTEGER;

ALTER TABLE events DROP COLUMN id_location;
ALTER TABLE events ADD COLUMN id_location UUID;

ALTER TABLE events DROP COLUMN id_org;
ALTER TABLE events ADD COLUMN id_org UUID NOT NULL;

ALTER TABLE events ADD COLUMN obsolete_at INTEGER;
ALTER TABLE events ADD COLUMN published_at INTEGER;

ALTER TABLE events DROP COLUMN code;
ALTER TABLE events ADD COLUMN id UUID PRIMARY KEY;

ALTER TABLE orgs DROP COLUMN id;
ALTER TABLE orgs ADD COLUMN id UUID PRIMARY KEY;

ALTER TABLE members DROP COLUMN id_org;
ALTER TABLE members ADD COLUMN id_org UUID NOT NULL;
ALTER TABLE members ADD CONSTRAINT id_org_phone_unique UNIQUE (id_org, phone);

ALTER TABLE vehicles DROP COLUMN id;
ALTER TABLE vehicles ADD COLUMN id UUID PRIMARY KEY;

ALTER TABLE vehicles DROP COLUMN id_org;
ALTER TABLE vehicles ADD COLUMN id_org UUID NOT NULL;

ALTER TABLE vehicles DROP COLUMN is_removed;
ALTER TABLE vehicles ADD COLUMN obsolete_at INTEGER;

ALTER TABLE event_drivers DROP COLUMN code;
ALTER TABLE event_drivers ADD COLUMN id_event UUID NOT NULL;
ALTER TABLE event_drivers ADD CONSTRAINT id_event_phone_unique UNIQUE (id_event, phone);
ALTER TABLE event_drivers ADD COLUMN obsolete_at INTEGER;

ALTER TABLE event_drivers DROP COLUMN id_vehicle;
ALTER TABLE event_drivers ADD COLUMN id_vehicle UUID NOT NULL;

ALTER TABLE reservations DROP COLUMN id;
ALTER TABLE reservations ADD COLUMN id UUID PRIMARY KEY;
ALTER TABLE reservations DROP COLUMN id_event;
ALTER TABLE reservations ADD COLUMN id_event UUID NOT NULL;
