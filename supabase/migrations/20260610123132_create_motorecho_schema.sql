/*
# MotorEcho Schema Migration

1. New Tables
- `vehicles`: Stores vehicle profiles for the user.
  - `id` (uuid, primary key)
  - `brand` (text, not null)
  - `model` (text, not null)
  - `year` (integer, not null)
  - `fuel_type` (text, not null)
  - `engine` (text, not null)
  - `created_at` (timestamp with time zone, default now())

- `settings`: Stores app-level preferences and state.
  - `id` (uuid, primary key)
  - `onboarding_seen` (boolean, default false)
  - `premium_active` (boolean, default false)
  - `selected_vehicle_id` (uuid, nullable, references vehicles)
  - `created_at` (timestamp with time zone, default now())
  - `updated_at` (timestamp with time zone, default now())

2. Modified Tables
- `diagnostics`: Add `vehicle_id` column (nullable uuid) to associate each analysis with a vehicle.

3. Security
- Enable RLS on all new tables.
- Single-tenant app (no auth), so all policies allow `anon` and `authenticated` to read/write.
- No auth needed; all users share the same data within a single device session.
*/

CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  fuel_type text NOT NULL,
  engine text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_vehicles" ON vehicles;
CREATE POLICY "anon_select_vehicles" ON vehicles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_vehicles" ON vehicles;
CREATE POLICY "anon_insert_vehicles" ON vehicles FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_vehicles" ON vehicles;
CREATE POLICY "anon_update_vehicles" ON vehicles FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_vehicles" ON vehicles;
CREATE POLICY "anon_delete_vehicles" ON vehicles FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_seen boolean NOT NULL DEFAULT false,
  premium_active boolean NOT NULL DEFAULT false,
  selected_vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_settings" ON settings;
CREATE POLICY "anon_select_settings" ON settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_settings" ON settings;
CREATE POLICY "anon_insert_settings" ON settings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_settings" ON settings;
CREATE POLICY "anon_update_settings" ON settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_settings" ON settings;
CREATE POLICY "anon_delete_settings" ON settings FOR DELETE
  TO anon, authenticated USING (true);

ALTER TABLE diagnostics ADD COLUMN IF NOT EXISTS vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL;
