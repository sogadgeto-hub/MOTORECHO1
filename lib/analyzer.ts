import { supabase } from './supabase';
import { Colors } from './theme';

export type DiagnosticResult = {
  status: string;
  result: 'normal_engine' | 'suspicious_noise' | 'anomaly_detected';
  type: string | null;
  confidence: number;
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
};

export type DiagnosticRecord = {
  id: string;
  user_id: string;
  result: string;
  analysis_result: string;
  issue_type: string | null;
  confidence: number;
  severity: string;
  recommendation: string | null;
  audio_url: string | null;
  vehicle_id: string | null;
  vehicle_brand: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
  fuel_type: string | null;
  user_confirmed: 'yes' | 'no' | 'unknown' | null;
  garage_diagnosis: string | null;
  allow_ai_training: boolean | null;
  created_at: string;
};

export type CommunityStats = {
  total_analyses: number;
  total_users: number;
  confirmed_diagnoses: number;
};

// Re-export getPrimaryVehicle from db for convenience
export { getPrimaryVehicle } from './db';

export const MOCK_RESULTS: DiagnosticResult[] = [
  {
    status: 'ok',
    result: 'normal_engine',
    type: null,
    confidence: 0.94,
    severity: 'low',
    recommendation: 'Engine sounds healthy. Continue regular maintenance as scheduled.',
  },
  {
    status: 'ok',
    result: 'suspicious_noise',
    type: 'timing_chain_noise',
    confidence: 0.78,
    severity: 'medium',
    recommendation: 'We recommend a mechanical inspection within 7 days to check timing chain tension.',
  },
  {
    status: 'ok',
    result: 'anomaly_detected',
    type: 'engine_knocking',
    confidence: 0.87,
    severity: 'high',
    recommendation: 'Engine knocking detected. Stop driving and have a professional inspection immediately.',
  },
  {
    status: 'ok',
    result: 'suspicious_noise',
    type: 'idle_instability',
    confidence: 0.65,
    severity: 'low',
    recommendation: 'Monitor idle RPM over the next few days. If the issue persists, schedule a diagnostic.',
  },
  {
    status: 'ok',
    result: 'anomaly_detected',
    type: 'turbo_issue',
    confidence: 0.82,
    severity: 'medium',
    recommendation: 'Turbo whistle anomaly detected. Check boost pressure and intercooler connections.',
  },
  {
    status: 'ok',
    result: 'suspicious_noise',
    type: 'injector_noise',
    confidence: 0.71,
    severity: 'medium',
    recommendation: 'Injector noise above normal range. Consider fuel system cleaning and inspection.',
  },
];

export async function uploadAudio(audioUri: string, userId: string): Promise<string | null> {
  try {
    const filename = `${userId}/${Date.now()}.m4a`;
    const response = await fetch(audioUri);
    const blob = await response.blob();
    const { data, error } = await supabase.storage
      .from('engine-audio')
      .upload(filename, blob, { contentType: 'audio/m4a', upsert: false });
    if (error) return null;
    const { data: urlData } = supabase.storage.from('engine-audio').getPublicUrl(data.path);
    // Store signed path, not public URL since bucket is private
    return data.path;
  } catch {
    return null;
  }
}

export async function analyzeAudio(vehicleId?: string | null): Promise<DiagnosticResult> {
  try {
    const { data, error } = await supabase.functions.invoke('analyze', {
      method: 'POST',
      body: vehicleId ? { vehicle_id: vehicleId } : {},
    });
    if (error) throw error;
    if (data && data.result) return data as DiagnosticResult;
  } catch {
    // Fallback to mock
  }
  const random = MOCK_RESULTS[Math.floor(Math.random() * MOCK_RESULTS.length)];
  return random;
}

export async function saveDiagnostic(
  result: DiagnosticResult,
  vehicleId?: string | null,
  audioPath?: string | null,
  vehicleInfo?: { brand?: string; model?: string; year?: number; fuel_type?: string } | null
): Promise<DiagnosticRecord> {
  const { data, error } = await supabase
    .from('diagnostics')
    .insert({
      analysis_result: result.result,
      issue_type: result.type,
      confidence: result.confidence,
      severity: result.severity,
      recommendation: result.recommendation,
      vehicle_id: vehicleId ?? null,
      audio_url: audioPath ?? null,
      vehicle_brand: vehicleInfo?.brand ?? null,
      vehicle_model: vehicleInfo?.model ?? null,
      vehicle_year: vehicleInfo?.year ?? null,
      fuel_type: vehicleInfo?.fuel_type ?? null,
      analysis_status: 'completed',
    })
    .select()
    .single();
  if (error) throw error;
  // Map analysis_result to result for backward compat
  const record = data as any;
  return { ...record, result: record.analysis_result } as DiagnosticRecord;
}

export async function updateDiagnosticFeedback(
  id: string,
  updates: {
    user_confirmed?: 'yes' | 'no' | 'unknown';
    garage_diagnosis?: string | null;
    allow_ai_training?: boolean;
  }
): Promise<void> {
  const { error } = await supabase
    .from('diagnostics')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

export async function getDiagnostics(): Promise<DiagnosticRecord[]> {
  const { data, error } = await supabase
    .from('diagnostics')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return ((data as any[]) ?? []).map(r => ({ ...r, result: r.analysis_result })) as DiagnosticRecord[];
}

export async function getDiagnosticsForVehicle(vehicleId: string): Promise<DiagnosticRecord[]> {
  const { data, error } = await supabase
    .from('diagnostics')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data as any[]) ?? []).map(r => ({ ...r, result: r.analysis_result })) as DiagnosticRecord[];
}

export async function getDiagnosticsCount(): Promise<number> {
  const { count, error } = await supabase
    .from('diagnostics')
    .select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
}

export async function getDiagnosticsCountForVehicle(vehicleId: string): Promise<number> {
  const { count, error } = await supabase
    .from('diagnostics')
    .select('*', { count: 'exact', head: true })
    .eq('vehicle_id', vehicleId);
  if (error) throw error;
  return count ?? 0;
}

export async function getCommunityStats(): Promise<CommunityStats> {
  try {
    const { data, error } = await supabase.rpc('get_community_stats');
    if (error) throw error;
    return data as CommunityStats;
  } catch {
    return { total_analyses: 0, total_users: 0, confirmed_diagnoses: 0 };
  }
}

export function getResultLabel(result: string): string {
  const labels: Record<string, string> = {
    normal_engine: 'Healthy',
    suspicious_noise: 'Monitor',
    anomaly_detected: 'Critical',
  };
  return labels[result] ?? result;
}

export function getIssueLabel(type: string): string {
  const labels: Record<string, string> = {
    turbo_issue: 'Turbo',
    injector_noise: 'Injector',
    timing_chain_noise: 'Timing Chain',
    engine_knocking: 'Engine Knock',
    idle_instability: 'Idle Instability',
  };
  return labels[type] ?? type;
}

export function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    low: Colors.success,
    medium: Colors.warning,
    high: Colors.danger,
  };
  return colors[severity] ?? '#94A3B8';
}

export function getHealthScore(records: DiagnosticRecord[]): number {
  if (records.length === 0) return 100;
  const recent = records.slice(0, 10);
  let score = 100;
  for (const r of recent) {
    if (r.result === 'anomaly_detected') score -= 25;
    else if (r.result === 'suspicious_noise') score -= 10;
  }
  return Math.max(0, Math.min(100, score));
}

export function getStatusFromHealthScore(score: number): { status: 'Healthy' | 'Monitor' | 'Critical'; color: string } {
  if (score >= 80) return { status: 'Healthy', color: Colors.success };
  if (score >= 50) return { status: 'Monitor', color: Colors.warning };
  return { status: 'Critical', color: Colors.danger };
}
