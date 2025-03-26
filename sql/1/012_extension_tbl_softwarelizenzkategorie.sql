CREATE TABLE IF NOT EXISTS extension.tbl_softwarelizenzkategorie (
    lizenzkategorie_kurzbz varchar(32) NOT NULL,
	bezeichnung varchar(32) NOT NULL,
	CONSTRAINT tbl_softwarelizenzkategorie_pk PRIMARY KEY (lizenzkategorie_kurzbz)
);

GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE extension.tbl_softwarelizenzkategorie TO vilesci;
GRANT SELECT ON TABLE extension.tbl_softwarelizenzkategorie TO web;

INSERT INTO extension.tbl_softwarelizenzkategorie(lizenzkategorie_kurzbz, bezeichnung) VALUES
('freeedu', 'Free Education License'),
('opensource', 'Open Source License'),
('keybased', 'Key-based License'),
('norequired', 'No License required'),
('trial', 'Trial License'),
('demo', 'Demo License'),
('subscription', 'Subscription License'),
('perpetual', 'Perpetual License'),
('campus', 'Campus License')
ON CONFLICT (lizenzkategorie_kurzbz) DO NOTHING;

COMMENT ON TABLE extension.tbl_softwarelizenzkategorie IS 'Software Lizenzkategorie';

DO $$
BEGIN
    ALTER TABLE extension.tbl_software ADD COLUMN IF NOT EXISTS lizenzkategorie_kurzbz VARCHAR(32);
    ALTER TABLE extension.tbl_software ADD CONSTRAINT tbl_software_softwarelizenzkategorie_fk FOREIGN KEY (lizenzkategorie_kurzbz)
    REFERENCES extension.tbl_softwarelizenzkategorie (lizenzkategorie_kurzbz) MATCH FULL
    ON DELETE RESTRICT ON UPDATE CASCADE;
    EXCEPTION WHEN OTHERS THEN NULL;
END $$;
