import { supabase } from './supabase';

import { Colors } from './theme';
import {
  calculateVehicleHealthScore,
  resolveHealthLevel,
} from './vehicle-health';

import {

  parseAudioStorageMetadata,

  uploadAudioFile,

  validateAudioFile,

  type AudioFormat,

  type ValidatedAudioFile,

} from './audio';

import { recordingQualityToDbRow, dbRowToRecordingQuality } from './audio-quality/persist';
import { extractRecordingQuality } from './audio-quality/recommendation';
import type { RecordingQuality } from './audio-quality';



export type DiagnosticResult = {

  status: string;

  result: 'normal_engine' | 'suspicious_noise' | 'anomaly_detected';

  type: string | null;

  confidence: number;

  severity: 'low' | 'medium' | 'high';

  recommendation: string;

};



export type AnalysisOutcome = DiagnosticResult & {

  isSimulated: boolean;

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

  analysis_status: string | null;

  audio_duration_ms: number | null;

  audio_format: string | null;

  recording_quality_score: number | null;

  recording_quality_level: string | null;

  recording_duration_ms: number | null;

  average_volume: number | null;

  peak_volume: number | null;

  noise_level: number | null;

  clipping_detected: boolean | null;

  silence_detected: boolean | null;

  client_request_id: string | null;

  created_at: string;

};



export type SaveDiagnosticOptions = {
  clientRequestId?: string | null;
};



export type AudioDiagnosticMetadata = {

  durationMs: number;

  format: AudioFormat;

  storagePath?: string | null;

  isSimulated?: boolean;

  recordingQuality?: import('./audio-quality').RecordingQuality | null;

};



export type CommunityStats = {

  total_analyses: number;

  total_users: number;

  confirmed_diagnoses: number;

};



export { validateAudioFile, uploadAudioFile } from './audio';



// Re-export getPrimaryVehicle from db for convenience

export { getPrimaryVehicle } from './db';



export const MOCK_RESULTS: DiagnosticResult[] = [

  {

    status: 'ok',

    result: 'normal_engine',

    type: null,

    confidence: 0.94,

    severity: 'low',

    recommendation: 'Le moteur semble sain. Poursuivez l’entretien régulier prévu.',

  },

  {

    status: 'ok',

    result: 'suspicious_noise',

    type: 'timing_chain_noise',

    confidence: 0.78,

    severity: 'medium',

    recommendation: 'Inspection mécanique recommandée sous 7 jours pour vérifier la tension de la chaîne de distribution.',

  },

  {

    status: 'ok',

    result: 'anomaly_detected',

    type: 'engine_knocking',

    confidence: 0.87,

    severity: 'high',

    recommendation: 'Cognement moteur détecté. Arrêtez de rouler et faites inspecter le véhicule immédiatement.',

  },

  {

    status: 'ok',

    result: 'suspicious_noise',

    type: 'idle_instability',

    confidence: 0.65,

    severity: 'low',

    recommendation: 'Surveillez le ralenti dans les prochains jours. Si le problème persiste, planifiez un diagnostic.',

  },

  {

    status: 'ok',

    result: 'anomaly_detected',

    type: 'turbo_issue',

    confidence: 0.82,

    severity: 'medium',

    recommendation: 'Anomalie turbo détectée. Vérifiez la pression de suralimentation et les connexions de l’intercooler.',

  },

  {

    status: 'ok',

    result: 'suspicious_noise',

    type: 'injector_noise',

    confidence: 0.71,

    severity: 'medium',

    recommendation: 'Bruit d’injecteur au-dessus de la normale. Envisagez un nettoyage et une inspection du système d’injection.',

  },

];



function mapDiagnosticRow(record: Record<string, unknown>): DiagnosticRecord {
  const audioMeta = parseAudioStorageMetadata(record.audio_url as string | null);
  const mapped: DiagnosticRecord = {
    ...(record as DiagnosticRecord),
    result: (record.analysis_result as string) ?? (record.result as string),
    audio_duration_ms:
      (record.recording_duration_ms as number | null) ?? audioMeta.durationMs,
    audio_format: audioMeta.format,
    recording_quality_score: (record.recording_quality_score as number | null) ?? null,
    recording_quality_level: (record.recording_quality_level as string | null) ?? null,
    recording_duration_ms: (record.recording_duration_ms as number | null) ?? null,
    average_volume: record.average_volume != null ? Number(record.average_volume) : null,
    peak_volume: record.peak_volume != null ? Number(record.peak_volume) : null,
    noise_level: record.noise_level != null ? Number(record.noise_level) : null,
    clipping_detected: (record.clipping_detected as boolean | null) ?? null,
    silence_detected: (record.silence_detected as boolean | null) ?? null,
    client_request_id: (record.client_request_id as string | null) ?? null,
  };

  return mapped;
}



export function getRecordingQualityFromRecord(record: DiagnosticRecord): RecordingQuality | null {
  const fromDb = dbRowToRecordingQuality({
    recording_quality_score: record.recording_quality_score,
    recording_quality_level: record.recording_quality_level,
    recording_duration_ms: record.recording_duration_ms,
    average_volume: record.average_volume,
    peak_volume: record.peak_volume,
    noise_level: record.noise_level,
    clipping_detected: record.clipping_detected,
    silence_detected: record.silence_detected,
  });

  if (fromDb) return fromDb;

  return extractRecordingQuality(record.recommendation);
}



/** @deprecated Use uploadAudioFile from lib/audio.ts */

export async function uploadAudio(

  audioUri: string,

  userId: string,

  vehicleId?: string | null,

  durationMs = 0

): Promise<string | null> {

  try {

    const validated = await validateAudioFile(audioUri, durationMs || 1000);

    const uploaded = await uploadAudioFile(validated, userId, vehicleId ?? null);

    return uploaded.storagePath;

  } catch {

    return null;

  }

}



export async function analyzeAudio(vehicleId?: string | null): Promise<AnalysisOutcome> {

  try {

    const { data, error } = await supabase.functions.invoke('analyze', {

      method: 'POST',

      body: vehicleId ? { vehicle_id: vehicleId } : {},

    });

    if (error) throw error;

    if (data && data.result) {

      return { ...(data as DiagnosticResult), isSimulated: false };

    }

  } catch {

    // Fallback to mock beta analysis

  }



  const random = MOCK_RESULTS[Math.floor(Math.random() * MOCK_RESULTS.length)];

  return { ...random, isSimulated: true };

}



export async function saveDiagnostic(

  result: DiagnosticResult,

  vehicleId?: string | null,

  audioMetadata?: AudioDiagnosticMetadata | null,

  vehicleInfo?: { brand?: string; model?: string; year?: number; fuel_type?: string } | null,

  options?: SaveDiagnosticOptions

): Promise<DiagnosticRecord> {

  const { data: { session } } = await supabase.auth.getSession();

  const userId = session?.user?.id;

  if (!userId) {

    throw new Error('Aucune session authentifiée — veuillez vous reconnecter');

  }



  const isSimulated = audioMetadata?.isSimulated ?? false;

  const analysisStatus = isSimulated ? 'beta_simulated' : 'completed';

  const qualityRow = recordingQualityToDbRow(audioMetadata?.recordingQuality);
  const clientRequestId = options?.clientRequestId ?? null;

  const insertPayload = {
    user_id: userId,
    analysis_result: result.result,
    issue_type: result.type,
    confidence: result.confidence,
    severity: result.severity,
    recommendation: result.recommendation,
    vehicle_id: vehicleId ?? null,
    audio_url: audioMetadata?.storagePath ?? null,
    vehicle_brand: vehicleInfo?.brand ?? null,
    vehicle_model: vehicleInfo?.model ?? null,
    vehicle_year: vehicleInfo?.year ?? null,
    fuel_type: vehicleInfo?.fuel_type ?? null,
    analysis_status: analysisStatus,
    client_request_id: clientRequestId,
    ...qualityRow,
  };

  const { data, error } = await supabase.from('diagnostics').insert(insertPayload).select().single();

  if (error?.code === '23505' && clientRequestId) {
    const { data: existing, error: fetchError } = await supabase
      .from('diagnostics')
      .select('*')
      .eq('client_request_id', clientRequestId)
      .single();

    if (!fetchError && existing) {
      return finalizeDiagnosticRecord(existing as Record<string, unknown>, audioMetadata);
    }
  }

  if (error) throw error;

  return finalizeDiagnosticRecord(data as Record<string, unknown>, audioMetadata);
}



function finalizeDiagnosticRecord(
  row: Record<string, unknown>,
  audioMetadata?: AudioDiagnosticMetadata | null
): DiagnosticRecord {
  const record = mapDiagnosticRow(row);

  if (audioMetadata) {
    record.audio_duration_ms = audioMetadata.durationMs;
    record.audio_format = audioMetadata.format;
  }

  return record;
}



export type ProcessAudioDiagnosticResult = {
  record: DiagnosticRecord | null;
  analysis: AnalysisOutcome;
  saveFailed: boolean;
  saveErrorMessage?: string;
};

export async function processAudioDiagnostic(

  audioUri: string,

  durationMs: number,

  userId: string,

  vehicleId?: string | null,

  vehicleInfo?: { brand?: string; model?: string; year?: number; fuel_type?: string } | null,

  recordingQuality?: import('./audio-quality').RecordingQuality | null,

  clientRequestId?: string | null

): Promise<ProcessAudioDiagnosticResult> {

  const validated: ValidatedAudioFile = await validateAudioFile(audioUri, durationMs);

  const uploaded = await uploadAudioFile(validated, userId, vehicleId ?? null);

  const analysis = await analyzeAudio(vehicleId ?? null);

  try {
    const record = await saveDiagnostic(
      analysis,
      vehicleId ?? null,
      {
        durationMs: uploaded.durationMs,
        format: uploaded.format,
        storagePath: uploaded.storagePath,
        isSimulated: analysis.isSimulated,
        recordingQuality: recordingQuality ?? null,
      },
      vehicleInfo,
      { clientRequestId: clientRequestId ?? null }
    );

    return { record, analysis, saveFailed: false };
  } catch (saveError: unknown) {
    const saveErrorMessage =
      saveError instanceof Error ? saveError.message : 'Diagnostic save failed';

    return {
      record: null,
      analysis,
      saveFailed: true,
      saveErrorMessage,
    };
  }
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

  return ((data as Record<string, unknown>[]) ?? []).map(mapDiagnosticRow);

}



export async function getDiagnosticsForVehicle(vehicleId: string): Promise<DiagnosticRecord[]> {

  const { data, error } = await supabase

    .from('diagnostics')

    .select('*')

    .eq('vehicle_id', vehicleId)

    .order('created_at', { ascending: false });

  if (error) throw error;

  return ((data as Record<string, unknown>[]) ?? []).map(mapDiagnosticRow);

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
  return calculateVehicleHealthScore(
    records.map((record) => ({
      id: record.id,
      result: record.result,
      issue_type: record.issue_type,
      confidence: record.confidence,
      severity: record.severity,
      created_at: record.created_at,
    }))
  ).score;
}

export function getStatusFromHealthScore(score: number): { status: 'Healthy' | 'Monitor' | 'Critical'; color: string } {
  const level = resolveHealthLevel(score);

  if (level.id === 'excellent' || level.id === 'good') {
    return { status: 'Healthy', color: level.color };
  }
  if (level.id === 'watch' || level.id === 'advised') {
    return { status: 'Monitor', color: level.color };
  }
  return { status: 'Critical', color: level.color };
}


