CREATE TABLE IF NOT EXISTS extension.tbl_softwarelizenzserver (
	lizenzserver_kurzbz varchar(128) NOT NULL,
	bezeichnung varchar(256),
	macadresse varchar(256),
	ipadresse varchar(256),
	ansprechpartner text,
	anmerkung text,
	location text,
	CONSTRAINT tbl_softwarelizenzserver_pk PRIMARY KEY (lizenzserver_kurzbz)
);

GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE extension.tbl_softwarelizenzserver TO vilesci;
GRANT SELECT ON TABLE extension.tbl_softwarelizenzserver TO web;

COMMENT ON TABLE extension.tbl_softwarelizenzserver IS 'Liste der Lizenzserver';
