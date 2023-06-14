CREATE TABLE IF NOT EXISTS extension.tbl_software_softwarestatus (
	software_status_id integer NOT NULL,
	software_id integer NOT NULL,
	datum date NOT NULL,
	softwarestatus_kurzbz varchar(32) NOT NULL,
	uid varchar(32) NOT NULL,
	CONSTRAINT tbl_software_softwarestatus_pk PRIMARY KEY (software_status_id)
);

GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE extension.tbl_software_softwarestatus TO vilesci;
GRANT SELECT ON TABLE extension.tbl_software_softwarestatus TO web;

CREATE SEQUENCE IF NOT EXISTS extension.tbl_software_softwarestatus_software_status_id_seq
	INCREMENT BY 1
	NO MAXVALUE
	NO MINVALUE
	CACHE 1;
ALTER TABLE extension.tbl_software_softwarestatus ALTER COLUMN software_status_id SET DEFAULT nextval('extension.tbl_software_softwarestatus_software_status_id_seq');

GRANT SELECT, UPDATE ON extension.tbl_software_softwarestatus_software_status_id_seq TO vilesci;

DO $$
BEGIN
	ALTER TABLE extension.tbl_software_softwarestatus ADD CONSTRAINT tbl_software_softwarestatu_software_fk FOREIGN KEY (software_id)
	REFERENCES extension.tbl_software (software_id) MATCH FULL
	ON DELETE RESTRICT ON UPDATE CASCADE;
 	EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
	ALTER TABLE extension.tbl_software_softwarestatus ADD CONSTRAINT tbl_software_softwarestatus_softwarestatus_fk FOREIGN KEY (softwarestatus_kurzbz)
	REFERENCES extension.tbl_softwarestatus (softwarestatus_kurzbz) MATCH FULL
	ON DELETE RESTRICT ON UPDATE CASCADE;
 	EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
	ALTER TABLE extension.tbl_software_softwarestatus ADD CONSTRAINT tbl_software_softwarestatus_benutzer_fk FOREIGN KEY (uid)
	REFERENCES public.tbl_benutzer (uid) MATCH FULL
	ON DELETE RESTRICT ON UPDATE CASCADE;
 	EXCEPTION WHEN OTHERS THEN NULL;
END $$;

COMMENT ON TABLE extension.tbl_software_softwarestatus IS 'Statushistorie der Software';
