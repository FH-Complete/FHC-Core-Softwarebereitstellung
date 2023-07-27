CREATE TABLE IF NOT EXISTS extension.tbl_softwareimage_software (
	software_id integer NOT NULL,
	softwareimage_id integer NOT NULL,
	insertamum timestamp,
	insertvon varchar(32),
	CONSTRAINT tbl_softwareimage_software_pk PRIMARY KEY (software_id, softwareimage_id)
);

GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE extension.tbl_softwareimage_software TO vilesci;
GRANT SELECT ON TABLE extension.tbl_softwareimage_software TO web;

DO $$
BEGIN
	ALTER TABLE extension.tbl_softwareimage_software ADD CONSTRAINT tbl_softwareimage_software_software_fk FOREIGN KEY (software_id)
	REFERENCES extension.tbl_software (software_id) MATCH FULL
	ON DELETE CASCADE ON UPDATE CASCADE;
 	EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
	ALTER TABLE extension.tbl_softwareimage_software ADD CONSTRAINT tbl_softwareimage_software_softwareimage_fk FOREIGN KEY (softwareimage_id)
	REFERENCES extension.tbl_softwareimage (softwareimage_id) MATCH FULL
	ON DELETE CASCADE ON UPDATE CASCADE;
	EXCEPTION WHEN OTHERS THEN NULL;
END $$;

COMMENT ON TABLE extension.tbl_softwareimage_software IS 'Zuordnung von Software zu Images';
