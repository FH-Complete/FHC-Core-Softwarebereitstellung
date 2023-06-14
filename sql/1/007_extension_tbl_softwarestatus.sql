CREATE TABLE IF NOT EXISTS extension.tbl_softwarestatus (
	softwarestatus_kurzbz varchar(32) NOT NULL,
	bezeichnung varchar(256)[] NOT NULL,
	CONSTRAINT tbl_softwarestatus_pk PRIMARY KEY (softwarestatus_kurzbz)
);

GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE extension.tbl_softwarestatus TO vilesci;
GRANT SELECT ON TABLE extension.tbl_softwarestatus TO web;

INSERT INTO extension.tbl_softwarestatus(softwarestatus_kurzbz, bezeichnung) VALUES
('neu', '{Neu,New}'),
('budgetiert', '{Budgetiert,Budgeted}'),
('genehmigt', '{Genehmigt,Approved}'),
('verfuegbar', '{Verfügbar, Available}'),
('nichtverfuegbar', '{"Nicht verfügbar", "Not available"}')
ON CONFLICT (softwarestatus_kurzbz) DO NOTHING;

COMMENT ON TABLE extension.tbl_softwarestatus IS 'Status der Software';
