CREATE TABLE IF NOT EXISTS extension.tbl_software (
	software_id integer NOT NULL,
	softwaretyp_kurzbz character varying(32) NOT NULL,
	software_kurzbz varchar(64) NOT NULL,
	version character varying(64),
	beschreibung text,
	software_id_parent integer,
	hersteller varchar(256),
	os text,
	lizenzart text,
	anzahl_lizenzen integer,
	lizenzserver_kurzbz varchar(128),
	lizenzlaufzeit date,
	lizenzkosten numeric(8,2),
	interne_kosten numeric(8,2),
	ansprechpartner_intern text,
	ansprechpartner_extern text,
	aktiv boolean NOT NULL,
	kostentraeger_oe_kurzbz varchar(32),
	anmerkung_intern text,
	insertamum timestamp,
	insertvon varchar(32),
	updateamum timestamp,
	updatevon varchar(32),
	CONSTRAINT tbl_software_pk PRIMARY KEY (software_id),
	CONSTRAINT uq_software_kurzbz_version UNIQUE (software_kurzbz,version)
);

GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE extension.tbl_software TO vilesci;
GRANT SELECT ON TABLE extension.tbl_software TO web;

CREATE SEQUENCE IF NOT EXISTS extension.tbl_software_software_id_seq
	 INCREMENT BY 1
	 NO MAXVALUE
	 NO MINVALUE
	 CACHE 1;
ALTER TABLE extension.tbl_software ALTER COLUMN software_id SET DEFAULT nextval('extension.tbl_software_software_id_seq');

GRANT SELECT, UPDATE ON extension.tbl_software_software_id_seq TO vilesci;

DO $$
BEGIN
	ALTER TABLE extension.tbl_software ADD CONSTRAINT tbl_software_softwaretyp_fk FOREIGN KEY (softwaretyp_kurzbz)
	REFERENCES extension.tbl_softwaretyp (softwaretyp_kurzbz) MATCH FULL
	ON DELETE RESTRICT ON UPDATE CASCADE;
 	EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
	ALTER TABLE extension.tbl_software ADD CONSTRAINT tbl_software_softwarelizenzserver_fk FOREIGN KEY (lizenzserver_kurzbz)
	REFERENCES extension.tbl_softwarelizenzserver (lizenzserver_kurzbz) MATCH FULL
	ON DELETE RESTRICT ON UPDATE CASCADE;
 	EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
	ALTER TABLE extension.tbl_software ADD CONSTRAINT software_parent_software_fk FOREIGN KEY (software_id_parent)
	REFERENCES extension.tbl_software (software_id) MATCH SIMPLE
	ON DELETE RESTRICT ON UPDATE CASCADE;
 	EXCEPTION WHEN OTHERS THEN NULL;
END $$;

COMMENT ON TABLE extension.tbl_software IS 'List of Software';
