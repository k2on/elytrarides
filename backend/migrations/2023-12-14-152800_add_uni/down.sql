DROP TABLE colleges;
ALTER TABLE orgs
ADD COLUMN university TEXT,
DROP COLUMN college;
