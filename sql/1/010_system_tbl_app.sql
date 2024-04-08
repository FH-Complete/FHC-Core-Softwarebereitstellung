INSERT INTO system.tbl_app (app) VALUES
    ('softwarebereitstellung')
    ON CONFLICT (app) DO NOTHING;
