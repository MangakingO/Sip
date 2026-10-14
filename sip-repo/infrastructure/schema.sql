-- Sip database schema (midpoint prototype)
-- Load with: psql "postgresql://sipadmin:PASSWORD@DB_ENDPOINT:5432/sip" -f schema.sql

CREATE TABLE IF NOT EXISTS users (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cognito_sub  TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS locations (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_place_id TEXT UNIQUE,
    name           TEXT NOT NULL,
    address        TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A drink is a menu item at one location. Reviews attach here, not to free text,
-- which is what makes cross-location aggregation possible.
CREATE TABLE IF NOT EXISTS drinks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    category    TEXT,
    UNIQUE (location_id, name)
);

CREATE TABLE IF NOT EXISTS reviews (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    drink_id   UUID NOT NULL REFERENCES drinks(id) ON DELETE CASCADE,
    rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    modified   BOOLEAN NOT NULL DEFAULT false,
    note       TEXT,
    photo_key  TEXT,
    thumb_key  TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One review per unmodified drink per user. "Review Again" updates in place.
CREATE UNIQUE INDEX IF NOT EXISTS reviews_one_per_unmodified
    ON reviews (user_id, drink_id) WHERE modified = false;

CREATE INDEX IF NOT EXISTS reviews_drink_idx ON reviews (drink_id);

-- Seed data so the prototype has something to show.
INSERT INTO locations (google_place_id, name, address) VALUES
    ('seed-brewed', 'Brewed & Co', '101 Main St, Fort Worth, TX'),
    ('seed-avoca',  'Avoca Coffee', '1311 W Magnolia Ave, Fort Worth, TX')
ON CONFLICT (google_place_id) DO NOTHING;

INSERT INTO drinks (location_id, name, category)
SELECT id, d.name, d.category
FROM locations l
CROSS JOIN (VALUES
    ('Oat Milk Latte', 'coffee'),
    ('Cortado', 'coffee'),
    ('Matcha Latte', 'matcha')
) AS d(name, category)
WHERE l.google_place_id IN ('seed-brewed', 'seed-avoca')
ON CONFLICT (location_id, name) DO NOTHING;
