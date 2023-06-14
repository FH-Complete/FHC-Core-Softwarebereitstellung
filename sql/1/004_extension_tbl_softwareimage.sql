CREATE TABLE IF NOT EXISTS extension.tbl_softwareimage (
	softwareimage_id integer NOT NULL,
	bezeichnung varchar(256) NOT NULL,
	verfuegbarkeit_start date,
	verfuegbarkeit_ende date,
	anmerkung text,
	betriebssystem varchar(256),
	CONSTRAINT tbl_software_image_pk PRIMARY KEY (softwareimage_id)
);

GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE extension.tbl_softwareimage TO vilesci;
GRANT SELECT ON TABLE extension.tbl_softwareimage TO web;

CREATE SEQUENCE IF NOT EXISTS extension.tbl_softwareimage_softwareimage_id_seq
	 INCREMENT BY 1
	 NO MAXVALUE
	 NO MINVALUE
	 CACHE 1;
ALTER TABLE extension.tbl_softwareimage ALTER COLUMN softwareimage_id SET DEFAULT nextval('extension.tbl_softwareimage_softwareimage_id_seq');

GRANT SELECT, UPDATE ON extension.tbl_softwareimage_softwareimage_id_seq TO vilesci;

COMMENT ON TABLE extension.tbl_softwareimage IS 'Softwareimages und Medien';
