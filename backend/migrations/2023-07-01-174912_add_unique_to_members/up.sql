ALTER TABLE members
ADD CONSTRAINT id_org_phone_unique UNIQUE (id_org, phone);
