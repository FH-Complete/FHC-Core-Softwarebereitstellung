CREATE SCHEMA IF NOT EXISTS extension;

INSERT INTO system.tbl_berechtigung(berechtigung_kurzbz, beschreibung)
SELECT 'extension/software_verwalten', 'Software- und Lizenzmanagement'
    WHERE
	NOT EXISTS(SELECT 1 FROM system.tbl_berechtigung WHERE berechtigung_kurzbz='extension/software_verwalten');