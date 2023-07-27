CREATE TABLE IF NOT EXISTS extension.tbl_softwareimage_ort (
	softwareimage_id integer NOT NULL,
	ort_kurzbz varchar(32) NOT NULL,
	verfuegbarkeit_start date,
	verfuegbarkeit_ende date,
	CONSTRAINT tbl_softwareimage_ort_pk PRIMARY KEY (softwareimage_id, ort_kurzbz)
);

GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE extension.tbl_softwareimage_ort TO vilesci;
GRANT SELECT ON TABLE extension.tbl_softwareimage_ort TO web;

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
