import { supabase } from '@/lib/supabase';
import type { HealthLevelId } from './types';

export type VehicleHealthSnapshot = {
  id: string;
  vehicle_id: string;
  analysis_id: string | null;
  score: number;
  health_level: HealthLevelId;
  created_at: string;
};

/** Persistance optionnelle — n'impacte pas le calcul client actuel. */
export async function upsertHealthSnapshot(input: {
  vehicleId: string;
  analysisId?: string | null;
  score: number;
  healthLevel: HealthLevelId;
}): Promise<void> {
  const { error } = await supabase.from('vehicle_health_snapshots').insert({
    vehicle_id: input.vehicleId,
    analysis_id: input.analysisId ?? null,
    score: input.score,
    health_level: input.healthLevel,
  });

  if (error && __DEV__) {
    console.log('[vehicle-health] snapshot insert skipped:', error.message);
  }
}

export async function getHealthSnapshots(vehicleId: string, limit = 50): Promise<VehicleHealthSnapshot[]> {
  const { data, error } = await supabase
    .from('vehicle_health_snapshots')
    .select('id, vehicle_id, analysis_id, score, health_level, created_at')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    if (__DEV__) console.log('[vehicle-health] snapshots fetch failed:', error.message);
    return [];
  }

  return (data as VehicleHealthSnapshot[]) ?? [];
}
