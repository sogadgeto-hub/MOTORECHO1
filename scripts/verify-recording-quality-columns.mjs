import fs from 'node:fs';
import path from 'node:path';

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.local not found');
  }

  const entries = fs
    .readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((line) => line.trim() && !line.trim().startsWith('#'))
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index), line.slice(index + 1)];
    });

  return Object.fromEntries(entries);
}

const env = loadEnvLocal();
const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.error('FAIL: EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY missing in .env.local');
  process.exit(1);
}

const host = new URL(supabaseUrl).hostname;
console.log(`Target Supabase project host: ${host}`);
console.log('Checking diagnostics columns via PostgREST...');

const columns = [
  'recording_quality_score',
  'recording_quality_level',
  'recording_duration_ms',
  'average_volume',
  'peak_volume',
  'noise_level',
  'clipping_detected',
  'silence_detected',
  'client_request_id',
].join(',');

const response = await fetch(
  `${supabaseUrl.replace(/\/$/, '')}/rest/v1/diagnostics?select=${columns}&limit=1`,
  {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
  }
);

if (!response.ok) {
  const body = await response.text();
  console.error(`FAIL: HTTP ${response.status}`);
  console.error(body);
  console.error('');
  console.error('If columns are missing, apply on TEST Supabase only:');
  console.error('  supabase/migrations/20260718000000_recording_quality_columns.sql');
  process.exit(1);
}

console.log('OK: all recording quality columns are exposed on diagnostics.');
console.log('Migration appears applied on the configured test Supabase project.');
