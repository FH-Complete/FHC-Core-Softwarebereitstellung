CREATE TABLE IF NOT EXISTS extension.tbl_softwaretyp (
	softwaretyp_kurzbz character varying(32) NOT NULL,
	bezeichnung varchar(256)[] NOT NULL,
	CONSTRAINT tbl_softwaretyp_pk PRIMARY KEY (softwaretyp_kurzbz)
);

GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE extension.tbl_softwaretyp TO vilesci;
GRANT SELECT ON TABLE extension.tbl_softwaretyp TO web;

INSERT INTO extension.tbl_softwaretyp(softwaretyp_kurzbz, bezeichnung) VALUES
('paket','{Paket,Paket}'),
('software','{Software,Software}'),
('modul','{Modul,Module}'),
('config','{Config,Config}')
ON CONFLICT (softwaretyp_kurzbz) DO NOTHING;
