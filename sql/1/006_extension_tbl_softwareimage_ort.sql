CREATE TABLE IF NOT EXISTS extension.tbl_softwareimage_ort (
    softwareimageort_id integer NOT NULL,
	softwareimage_id integer NOT NULL,
	ort_kurzbz varchar(32) NOT NULL,
	verfuegbarkeit_start date,
	verfuegbarkeit_ende date,
	CONSTRAINT tbl_softwareimage_ort_pk PRIMARY KEY (softwareimageort_id)
);

GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE extension.tbl_softwareimage_ort TO vilesci;
GRANT SELECT ON TABLE extension.tbl_softwareimage_ort TO web;

CREATE SEQUENCE IF NOT EXISTS extension.tbl_softwareimage_ort_softwareimageort_id_seq
	 INCREMENT BY 1
	 NO MAXVALUE
	 NO MINVALUE
	 CACHE 1;
ALTER TABLE extension.tbl_softwareimage_ort ALTER COLUMN softwareimageort_id SET DEFAULT nextval('extension.tbl_softwareimage_ort_softwareimageort_id_seq');

GRANT SELECT, UPDATE ON extension.tbl_softwareimage_ort_softwareimageort_id_seq TO vilesci;

DO $$
BEGIN
	ALTER TABLE extension.tbl_softwareimage_ort ADD CONSTRAINT tbl_softwareimage_ort_softwareimage_fk FOREIGN KEY (softwareimage_id)
	REFERENCES extension.tbl_softwareimage (softwareimage_id) MATCH FULL
	ON DELETE CASCADE ON UPDATE CASCADE;
 	EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
	ALTER TABLE extension.tbl_softwareimage_ort ADD CONSTRAINT tbl_softwareimage_ort_ort_fk FOREIGN KEY (ort_kurzbz)
	REFERENCES public.tbl_ort (ort_kurzbz) MATCH FULL
	ON DELETE RESTRICT ON UPDATE CASCADE;
 	EXCEPTION WHEN OTHERS THEN NULL;
END $$;

COMMENT ON TABLE extension.tbl_softwareimage_ort IS 'Zuordnung von Softwareimages zu Raum';
