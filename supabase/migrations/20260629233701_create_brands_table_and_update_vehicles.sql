/*
# Create brands reference table and add brand_id to vehicles

## Summary
This migration introduces a database-driven brand system to replace the static
hardcoded list in the UI. Car brands are now managed centrally in the database,
making it trivial to add new manufacturers without any code changes.

## 1. New Tables

### `brands`
A global reference table of car manufacturers.
- `id` — UUID primary key
- `name` — brand name (unique, e.g. "BMW")
- `country` — country of origin (optional, e.g. "Germany")
- `logo_url` — remote URL for brand logo (optional, for future use)
- `created_at` — insertion timestamp

## 2. Modified Tables

### `vehicles`
- Added `brand_id` (uuid, nullable FK → brands.id ON DELETE SET NULL)
- The existing `brand` text column is preserved for backward compatibility
  with existing vehicle records and as a display cache for joins.

## 3. Initial Data
50+ global car brands are seeded covering French, German, Italian, Japanese,
Korean, American, British, Swedish, and other manufacturers. The list is
intentionally expandable — new brands can be added via SQL or admin tooling
with no code changes required.

## 4. Security

### brands table
- RLS enabled
- Public SELECT for both `anon` and `authenticated` (it is a public reference table)
- No INSERT/UPDATE/DELETE for regular users — brands are system-managed

### vehicles table
- Existing RLS policies are unchanged
- brand_id column follows the same ownership model as other vehicle columns

## 5. Notes
- `brand_id` is nullable so existing vehicle rows are not broken
- New vehicle inserts should set both `brand_id` (FK) and `brand` (text cache)
  so existing display code that reads `v.brand` continues to work
- The `brand` text column should NOT be dropped — it serves as a denormalized
  display cache and supports legacy records
*/

-- ─────────────────────────────────────────────
-- 1. Create brands table
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brands (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL UNIQUE,
  country    text,
  logo_url   text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- Public read-only access (brands are a shared reference table)
DROP POLICY IF EXISTS "brands_public_select" ON brands;
CREATE POLICY "brands_public_select" ON brands
  FOR SELECT TO anon, authenticated
  USING (true);

-- No user write access — brands are managed at system level

-- ─────────────────────────────────────────────
-- 2. Add brand_id FK to vehicles (nullable)
-- ─────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'brand_id'
  ) THEN
    ALTER TABLE vehicles
      ADD COLUMN brand_id uuid REFERENCES brands(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Index for analytics / JOIN performance
CREATE INDEX IF NOT EXISTS vehicles_brand_id_idx ON vehicles(brand_id);

-- ─────────────────────────────────────────────
-- 3. Seed comprehensive brand list
-- ─────────────────────────────────────────────
INSERT INTO brands (name, country) VALUES
  -- French
  ('Peugeot',        'France'),
  ('Renault',        'France'),
  ('Citroën',        'France'),
  ('DS Automobiles', 'France'),
  ('Alpine',         'France'),
  -- German
  ('Audi',           'Germany'),
  ('BMW',            'Germany'),
  ('Mercedes-Benz',  'Germany'),
  ('Volkswagen',     'Germany'),
  ('Opel',           'Germany'),
  ('Porsche',        'Germany'),
  ('Smart',          'Germany'),
  -- Italian
  ('Alfa Romeo',     'Italy'),
  ('Ferrari',        'Italy'),
  ('Fiat',           'Italy'),
  ('Lamborghini',    'Italy'),
  ('Lancia',         'Italy'),
  ('Maserati',       'Italy'),
  -- Japanese
  ('Honda',          'Japan'),
  ('Lexus',          'Japan'),
  ('Mazda',          'Japan'),
  ('Mitsubishi',     'Japan'),
  ('Nissan',         'Japan'),
  ('Subaru',         'Japan'),
  ('Suzuki',         'Japan'),
  ('Toyota',         'Japan'),
  ('Infiniti',       'Japan'),
  ('Daihatsu',       'Japan'),
  -- Korean
  ('Genesis',        'South Korea'),
  ('Hyundai',        'South Korea'),
  ('Kia',            'South Korea'),
  -- American
  ('Cadillac',       'USA'),
  ('Chevrolet',      'USA'),
  ('Dodge',          'USA'),
  ('Ford',           'USA'),
  ('GMC',            'USA'),
  ('Jeep',           'USA'),
  ('Lincoln',        'USA'),
  ('Ram',            'USA'),
  ('Tesla',          'USA'),
  -- British
  ('Aston Martin',   'United Kingdom'),
  ('Bentley',        'United Kingdom'),
  ('Jaguar',         'United Kingdom'),
  ('Land Rover',     'United Kingdom'),
  ('MINI',           'United Kingdom'),
  ('Rolls-Royce',    'United Kingdom'),
  -- Swedish
  ('Volvo',          'Sweden'),
  ('SAAB',           'Sweden'),
  ('Polestar',       'Sweden'),
  -- Czech / Spanish
  ('Skoda',          'Czech Republic'),
  ('SEAT',           'Spain'),
  ('Cupra',          'Spain'),
  -- Romanian / Russian
  ('Dacia',          'Romania'),
  ('Lada',           'Russia'),
  -- Chinese
  ('BYD',            'China'),
  ('MG',             'China'),
  ('Geely',          'China'),
  ('NIO',            'China'),
  -- Other
  ('Datsun',         'Japan'),
  ('Isuzu',          'Japan'),
  ('Acura',          'Japan'),
  ('SsangYong',      'South Korea'),
  ('Chrysler',       'USA'),
  ('Buick',          'USA'),
  ('Rivian',         'USA'),
  ('Lucid',          'USA')
ON CONFLICT (name) DO NOTHING;
