CREATE TABLE IF NOT EXISTS extension.tbl_softwarelizenztyp (
    softwarelizenztyp_kurzbz varchar(32) NOT NULL,
	bezeichnung varchar(32) NOT NULL,
	CONSTRAINT tbl_softwarelizenztyp_pk PRIMARY KEY (softwarelizenztyp_kurzbz)
);

GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE extension.tbl_softwarelizenztyp TO vilesci;
GRANT SELECT ON TABLE extension.tbl_softwarelizenztyp TO web;

INSERT INTO extension.tbl_softwarelizenztyp(softwarelizenztyp_kurzbz, bezeichnung) VALUES
('concurrent', 'concurrent'),
('floating', 'floating'),
('userbased', 'user based'),
('machinebased', 'machine based'),
('cloudbased', 'cloud based'),
('opensource', 'open source')
ON CONFLICT (softwarelizenztyp_kurzbz) DO NOTHING;

COMMENT ON TABLE extension.tbl_softwarelizenztyp IS 'Software Lizenztyp';
