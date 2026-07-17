-- Sprint 5.7 — dedicated recording quality fields on diagnostics (nullable for legacy rows)

ALTER TABLE diagnostics
  ADD COLUMN IF NOT EXISTS recording_quality_score INTEGER
    CHECK (recording_quality_score IS NULL OR (recording_quality_score >= 0 AND recording_quality_score <= 100)),
  ADD COLUMN IF NOT EXISTS recording_quality_level TEXT
    CHECK (recording_quality_level IS NULL OR recording_quality_level IN ('excellent', 'good', 'fair', 'poor')),
  ADD COLUMN IF NOT EXISTS recording_duration_ms INTEGER
    CHECK (recording_duration_ms IS NULL OR recording_duration_ms >= 0),
  ADD COLUMN IF NOT EXISTS average_volume NUMERIC(8, 5)
    CHECK (average_volume IS NULL OR (average_volume >= 0 AND average_volume <= 1)),
  ADD COLUMN IF NOT EXISTS peak_volume NUMERIC(8, 5)
    CHECK (peak_volume IS NULL OR (peak_volume >= 0 AND peak_volume <= 1)),
  ADD COLUMN IF NOT EXISTS noise_level NUMERIC(8, 5)
    CHECK (noise_level IS NULL OR (noise_level >= 0 AND noise_level <= 1)),
  ADD COLUMN IF NOT EXISTS clipping_detected BOOLEAN,
  ADD COLUMN IF NOT EXISTS silence_detected BOOLEAN,
  ADD COLUMN IF NOT EXISTS client_request_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS diagnostics_client_request_id_unique
  ON diagnostics (client_request_id)
  WHERE client_request_id IS NOT NULL;

COMMENT ON COLUMN diagnostics.recording_quality_score IS 'Audio capture quality 0-100 (not diagnostic confidence)';
COMMENT ON COLUMN diagnostics.client_request_id IS 'Client idempotency key to prevent duplicate diagnostics on retry';
