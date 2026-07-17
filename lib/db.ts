import { supabase } from './supabase';
import type { PostgrestError } from '@supabase/supabase-js';

export type Brand = {
  id: string;
  name: string;
  country: string | null;
  logo_url: string | null;
  created_at: string;
};

export type Vehicle = {
  id: string;
  user_id: string;
  brand: string;
  brand_id: string | null;
  model: string;
  year: number;
  fuel_type: string;
  engine_type: string;
  nickname: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};

export type Diagnostic = {
  id: string;
  user_id: string;
  vehicle_id: string | null;
  audio_url: string | null;
  result: string;
  issue_type: string | null;
  confidence: number;
  severity: string;
  recommendation: string | null;
  created_at: string;
};

export type VehicleValidationCode =
  | 'BRAND_REQUIRED'
  | 'BRAND_MISSING'
  | 'MODEL_REQUIRED'
  | 'YEAR_REQUIRED'
  | 'YEAR_INVALID'
  | 'FUEL_REQUIRED'
  | 'ENGINE_REQUIRED';

export type VehicleDbErrorCode =
  | 'NOT_AUTHENTICATED'
  | 'SESSION_EXPIRED'
  | 'BRAND_INVALID'
  | 'SCHEMA_OUTDATED'
  | 'CREATE_FAILED';

const VALIDATION_MESSAGES_FR: Record<VehicleValidationCode, string> = {
  BRAND_REQUIRED: 'Veuillez sélectionner une marque dans la liste',
  BRAND_MISSING: 'Le nom de la marque est manquant',
  MODEL_REQUIRED: 'Le modèle est obligatoire',
  YEAR_REQUIRED: "L'année est obligatoire",
  YEAR_INVALID: `L'année doit être entre 1900 et ${new Date().getFullYear() + 2}`,
  FUEL_REQUIRED: 'Le type de carburant est obligatoire',
  ENGINE_REQUIRED: 'Le type de moteur est obligatoire',
};

const DB_ERROR_MESSAGES_FR: Record<VehicleDbErrorCode, string> = {
  NOT_AUTHENTICATED: 'Aucune session authentifiée — veuillez vous reconnecter',
  SESSION_EXPIRED: 'Session expirée — veuillez vous reconnecter',
  BRAND_INVALID: 'Marque invalide — veuillez la resélectionner dans la liste',
  SCHEMA_OUTDATED: 'Configuration serveur incomplète (marques). Contactez le support',
  CREATE_FAILED: "Échec de l'enregistrement du véhicule",
};

export function getVehicleValidationMessage(code: VehicleValidationCode): string {
  return VALIDATION_MESSAGES_FR[code];
}

export function getVehicleDbErrorMessage(code: VehicleDbErrorCode): string {
  return DB_ERROR_MESSAGES_FR[code];
}

export function mapVehicleDbError(error: PostgrestError | Error): string {
  if (!(error && typeof error === 'object' && 'code' in error)) {
    if (error.message.includes('Not authenticated') || error.message.includes('session authentifiée')) {
      return DB_ERROR_MESSAGES_FR.NOT_AUTHENTICATED;
    }
    return `${DB_ERROR_MESSAGES_FR.CREATE_FAILED} : ${error.message}`;
  }

  const pg = error as PostgrestError;
  const msg = pg.message ?? '';
  const code = pg.code ?? '';

  if (code === '42501' || msg.toLowerCase().includes('row-level security')) {
    return DB_ERROR_MESSAGES_FR.SESSION_EXPIRED;
  }
  if (code === '23503' && msg.includes('brand_id')) {
    return DB_ERROR_MESSAGES_FR.BRAND_INVALID;
  }
  if (code === '42703' && msg.includes('brand_id')) {
    return DB_ERROR_MESSAGES_FR.SCHEMA_OUTDATED;
  }

  const detail = pg.details ? ` (${pg.details})` : '';
  const hint = pg.hint ? ` — ${pg.hint}` : '';
  return `${DB_ERROR_MESSAGES_FR.CREATE_FAILED} : ${msg}${detail}${hint}`;
}

export async function getBrands(): Promise<Brand[]> {
  const { data, error } = await supabase
    .from('brands')
    .select('id, name, country')
    .order('name', { ascending: true });

  if (error) throw error;
  return (data as Brand[]) ?? [];
}

export async function getVehicles(): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as Vehicle[]) ?? [];
}

/** Charge les véhicules avec logs DEV (count, ids, user_id, erreurs). */
export async function fetchVehicles(): Promise<Vehicle[]> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (__DEV__) {
    console.log('[Vehicles] fetchVehicles — auth', {
      userId: user?.id ?? null,
      authError: authError?.message ?? null,
    });
  }

  try {
    const vehicles = await getVehicles();

    if (__DEV__) {
      console.log('[Vehicles] fetchVehicles — result', {
        count: vehicles.length,
        ids: vehicles.map((v) => v.id),
        userIds: [...new Set(vehicles.map((v) => v.user_id))],
        primaryIds: vehicles.filter((v) => v.is_primary).map((v) => v.id),
      });
    }

    return vehicles;
  } catch (error) {
    if (__DEV__) {
      console.log('[Vehicles] fetchVehicles — error', error);
    }
    throw error;
  }
}

export async function getVehicle(id: string): Promise<Vehicle | null> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as Vehicle | null;
}

export async function getPrimaryVehicle(): Promise<Vehicle | null> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('is_primary', true)
    .maybeSingle();

  if (error) throw error;
  if (data) return data as Vehicle;

  const { data: fallback, error: fallbackError } = await supabase
    .from('vehicles')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (fallbackError) throw fallbackError;
  return (fallback as Vehicle | null) ?? null;
}

export type VehiclePayload = Omit<Vehicle, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_primary'>;

export function validateVehiclePayload(v: VehiclePayload): VehicleValidationCode | null {
  if (!v.brand_id) return 'BRAND_REQUIRED';
  if (!v.brand?.trim()) return 'BRAND_MISSING';
  if (!v.model?.trim()) return 'MODEL_REQUIRED';
  if (!v.year || isNaN(v.year)) return 'YEAR_REQUIRED';
  if (v.year < 1900 || v.year > new Date().getFullYear() + 2) return 'YEAR_INVALID';
  if (!v.fuel_type?.trim()) return 'FUEL_REQUIRED';
  if (!v.engine_type?.trim()) return 'ENGINE_REQUIRED';
  return null;
}

export async function createVehicle(vehicle: VehiclePayload): Promise<Vehicle> {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error(DB_ERROR_MESSAGES_FR.NOT_AUTHENTICATED);
  }

  const validationCode = validateVehiclePayload(vehicle);
  if (validationCode) {
    throw new Error(getVehicleValidationMessage(validationCode));
  }

  const { count, error: countError } = await supabase
    .from('vehicles')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (countError) {
    throw new Error(mapVehicleDbError(countError));
  }

  const payload = {
    ...vehicle,
    user_id: userId,
    is_primary: (count ?? 0) === 0,
  };

  const { data, error } = await supabase
    .from('vehicles')
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(mapVehicleDbError(error));
  }

  return data as Vehicle;
}

export async function updateVehicle(id: string, updates: Partial<Omit<Vehicle, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<Vehicle> {
  const { data, error } = await supabase
    .from('vehicles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Vehicle;
}

export async function deleteVehicle(id: string): Promise<void> {
  const { error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function setPrimaryVehicle(vehicleId: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error(DB_ERROR_MESSAGES_FR.NOT_AUTHENTICATED);
  }

  const now = new Date().toISOString();

  const { error: unsetError } = await supabase
    .from('vehicles')
    .update({ is_primary: false, updated_at: now })
    .eq('user_id', userId)
    .eq('is_primary', true);

  if (unsetError) {
    throw new Error(mapVehicleDbError(unsetError));
  }

  const { error: setError } = await supabase
    .from('vehicles')
    .update({ is_primary: true, updated_at: now })
    .eq('id', vehicleId)
    .eq('user_id', userId);

  if (setError) {
    throw new Error(mapVehicleDbError(setError));
  }
}

export async function getDiagnostics(limit = 50): Promise<Diagnostic[]> {
  const { data, error } = await supabase
    .from('diagnostics')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data as Diagnostic[]) ?? [];
}

export async function getVehicleDiagnostics(vehicleId: string, limit = 50): Promise<Diagnostic[]> {
  const { data, error } = await supabase
    .from('diagnostics')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data as Diagnostic[]) ?? [];
}

export async function createDiagnostic(diagnostic: Omit<Diagnostic, 'id' | 'user_id' | 'created_at'>): Promise<Diagnostic> {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error(DB_ERROR_MESSAGES_FR.NOT_AUTHENTICATED);
  }

  const { data, error } = await supabase
    .from('diagnostics')
    .insert({ ...diagnostic, user_id: userId })
    .select()
    .single();

  if (error) throw error;
  return data as Diagnostic;
}

export async function getMonthlyDiagnosticCount(): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('diagnostics')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', startOfMonth.toISOString());

  if (error) throw error;
  return count ?? 0;
}

export async function incrementAnalysisCount(): Promise<void> {
  const { error } = await supabase.rpc('increment_analysis_count');
  if (error) {
    console.error('Error incrementing analysis count:', error);
  }
}
