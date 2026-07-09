
-- Drop old diagnostics table and recreate with full schema
ALTER TABLE IF EXISTS diagnostics RENAME TO diagnostics_legacy;

CREATE TABLE IF NOT EXISTS diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  vehicle_brand TEXT,
  vehicle_model TEXT,
  vehicle_year INTEGER,
  fuel_type TEXT,
  audio_url TEXT,
  analysis_status TEXT NOT NULL DEFAULT 'completed',
  analysis_result TEXT NOT NULL,
  issue_type TEXT,
  confidence NUMERIC(5,4) NOT NULL DEFAULT 0,
  severity TEXT NOT NULL DEFAULT 'low',
  recommendation TEXT,
  user_confirmed TEXT CHECK (user_confirmed IN ('yes', 'no', 'unknown')),
  garage_diagnosis TEXT,
  allow_ai_training BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE diagnostics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_diagnostics" ON diagnostics FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_diagnostics" ON diagnostics FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_diagnostics" ON diagnostics FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_diagnostics" ON diagnostics FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_diagnostics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER diagnostics_updated_at
  BEFORE UPDATE ON diagnostics
  FOR EACH ROW EXECUTE FUNCTION update_diagnostics_updated_at();

-- Storage bucket for audio files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'engine-audio',
  'engine-audio',
  false,
  52428800,
  ARRAY['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/ogg', 'audio/mp3', 'audio/m4a', 'audio/x-m4a']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "upload_own_audio" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'engine-audio' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "read_own_audio" ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'engine-audio' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "delete_own_audio" ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'engine-audio' AND (storage.foldername(name))[1] = auth.uid()::text);
