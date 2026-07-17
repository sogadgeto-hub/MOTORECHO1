-- Sprint 5.2 — Snapshots santé véhicule (optionnel, compatible analyses existantes)
CREATE TABLE IF NOT EXISTS vehicle_health_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  analysis_id uuid REFERENCES diagnostics(id) ON DELETE SET NULL,
  score integer NOT NULL CHECK (score >= 0 AND score <= 100),
  health_level text NOT NULL CHECK (
    health_level IN ('excellent', 'good', 'watch', 'advised', 'urgent')
  ),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_health_snapshots_vehicle_id
  ON vehicle_health_snapshots(vehicle_id, created_at DESC);

ALTER TABLE vehicle_health_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own vehicle health snapshots"
  ON vehicle_health_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vehicles v
      WHERE v.id = vehicle_health_snapshots.vehicle_id
        AND v.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own vehicle health snapshots"
  ON vehicle_health_snapshots FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vehicles v
      WHERE v.id = vehicle_health_snapshots.vehicle_id
        AND v.user_id = auth.uid()
    )
  );
