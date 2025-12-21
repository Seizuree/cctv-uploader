-- Example schema to initialize the cameras table
CREATE TABLE IF NOT EXISTS cameras (
    id VARCHAR PRIMARY KEY,
    base_url TEXT NOT NULL,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Example seed
-- INSERT INTO cameras (id, base_url, username, password) VALUES
-- ('cam01', 'http://192.168.1.10:80', 'admin', 'changeme');

