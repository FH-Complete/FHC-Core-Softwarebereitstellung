CREATE TABLE IF NOT EXISTS extension.tbl_software_lv (
    software_lv_id INTEGER NOT NULL,
    software_id INTEGER NOT NULL,
    lehrveranstaltung_id INTEGER NOT NULL,
    studiensemester_kurzbz VARCHAR(32) NOT NULL,
    lizenzanzahl INTEGER,
    insertvon VARCHAR(32),
    insertamum TIMESTAMP DEFAULT NOW(),
    updatevon VARCHAR(32),
    updateamum TIMESTAMP,
    CONSTRAINT tbl_software_lv_pk PRIMARY KEY (software_lv_id),
    CONSTRAINT uq_software_id_lehrveranstaltung_id_studiensemester_kurzbz UNIQUE (software_id, lehrveranstaltung_id, studiensemester_kurzbz)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE extension.tbl_software_lv TO vilesci;

CREATE SEQUENCE IF NOT EXISTS extension.tbl_software_lv_software_lv_id_seq
	 INCREMENT BY 1
	 NO MAXVALUE
	 NO MINVALUE
	 CACHE 1;
ALTER TABLE extension.tbl_software_lv ALTER COLUMN software_lv_id SET DEFAULT nextval('extension.tbl_software_lv_software_lv_id_seq');

GRANT SELECT, UPDATE ON extension.tbl_software_lv_software_lv_id_seq TO vilesci;

DO $$
BEGIN
ALTER TABLE extension.tbl_software_lv ADD CONSTRAINT tbl_software_lv_software_fk FOREIGN KEY (software_id)
    REFERENCES extension.tbl_software (software_id) MATCH FULL
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
ALTER TABLE extension.tbl_software_lv ADD CONSTRAINT tbl_software_lv_lehrveranstaltung_fk FOREIGN KEY (lehrveranstaltung_id)
    REFERENCES lehre.tbl_lehrveranstaltung (lehrveranstaltung_id) MATCH FULL
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
ALTER TABLE extension.tbl_software_lv ADD CONSTRAINT tbl_software_lv_studiensemester_fk FOREIGN KEY (studiensemester_kurzbz)
    REFERENCES public.tbl_studiensemester (studiensemester_kurzbz) MATCH FULL
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

COMMENT ON TABLE extension.tbl_software_lv IS 'Zuordnung von Software zu Lehrveranstaltung und Studiensemester';