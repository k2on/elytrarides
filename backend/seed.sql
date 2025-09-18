INSERT INTO users (phone, name, created_at, updated_at)
VALUES
('+18002000001', 'Dennis', EXTRACT(EPOCH FROM NOW())::bigint, EXTRACT(EPOCH FROM NOW())::bigint)
ON CONFLICT (phone) DO NOTHING;

INSERT INTO orgs (id, label) 
VALUES 
('12cc7767-8831-4a06-9621-b5a71dd8d9f1', 'Admins')
ON CONFLICT (id) DO NOTHING;

INSERT INTO members (phone, flags, id_org) 
VALUES 
('+18002000001', 5, '12cc7767-8831-4a06-9621-b5a71dd8d9f1')
ON CONFLICT (id) DO NOTHING;

INSERT INTO colleges (id, name, logo_url, location_lat, location_lng, created_at)
VALUES 
('7910b823-0d9f-40e9-92aa-347040d296ec', 'Clemson', 'https://upload.wikimedia.org/wikipedia/commons/7/72/Clemson_Tigers_logo.svg', 34.683437, -82.837364, EXTRACT(EPOCH FROM NOW())::bigint)
ON CONFLICT (id) DO NOTHING;

