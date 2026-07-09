import { supabase } from './supabase';

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

// Get all brands ordered alphabetically
export async function getBrands(): Promise<Brand[]> {
  const { data, error } = await supabase
    .from('brands')
    .select('id, name, country')
    .order('name', { ascending: true });

  if (error) throw error;
  return (data as Brand[]) ?? [];
}

// Get all vehicles for the current user
export async function getVehicles(): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as Vehicle[]) ?? [];
}

// Get a specific vehicle
export async function getVehicle(id: string): Promise<Vehicle | null> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as Vehicle | null;
}

// Get primary vehicle for the current user
export async function getPrimaryVehicle(): Promise<Vehicle | null> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('is_primary', true)
    .maybeSingle();

  if (error) throw error;
  return data as Vehicle | null;
}

export type VehiclePayload = Omit<Vehicle, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_primary'>;

// Validate required vehicle fields before hitting the DB
export function validateVehiclePayload(v: VehiclePayload): string | null {
  if (!v.brand_id) return 'Please select a vehicle brand from the list';
  if (!v.brand?.trim()) return 'Brand name is missing';
  if (!v.model?.trim()) return 'Model is required';
  if (!v.year || isNaN(v.year)) return 'Year is required';
  if (v.year < 1900 || v.year > new Date().getFullYear() + 2) return `Year must be between 1900 and ${new Date().getFullYear() + 2}`;
  if (!v.fuel_type?.trim()) return 'Fuel type is required';
  if (!v.engine_type?.trim()) return 'Engine type is required';
  return null;
}

// Create a new vehicle
export async function createVehicle(vehicle: VehiclePayload): Promise<Vehicle> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error('Not authenticated — user_id is missing');

  const validationError = validateVehiclePayload(vehicle);
  if (validationError) throw new Error(validationError);

  const { data: existing } = await supabase
    .from('vehicles')
    .select('id')
    .limit(1)
    .maybeSingle();

  const payload = { ...vehicle, is_primary: !existing };
  console.log('[createVehicle] payload →', JSON.stringify(payload));

  const { data, error } = await supabase
    .from('vehicles')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('[createVehicle] DB error →', error);
    // Surface the real Postgres/PostgREST message
    const detail = error.details ? ` (${error.details})` : '';
    const hint = error.hint ? ` Hint: ${error.hint}` : '';
    throw new Error(`${error.message}${detail}${hint}`);
  }

  console.log('[createVehicle] success →', data?.id);
  return data as Vehicle;
}

// Update a vehicle
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

// Delete a vehicle
export async function deleteVehicle(id: string): Promise<void> {
  const { error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Set a vehicle as primary
export async function setPrimaryVehicle(vehicleId: string): Promise<void> {
  // First, unset all vehicles as primary
  await supabase
    .from('vehicles')
    .update({ is_primary: false })
    .eq('is_primary', true);

  // Then set the selected vehicle as primary
  const { error } = await supabase
    .from('vehicles')
    .update({ is_primary: true })
    .eq('id', vehicleId);

  if (error) throw error;
}

// Get diagnostics for the current user
export async function getDiagnostics(limit = 50): Promise<Diagnostic[]> {
  const { data, error } = await supabase
    .from('diagnostics')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data as Diagnostic[]) ?? [];
}

// Get diagnostics for a specific vehicle
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

// Create a diagnostic record
export async function createDiagnostic(diagnostic: Omit<Diagnostic, 'id' | 'user_id' | 'created_at'>): Promise<Diagnostic> {
  const { data, error } = await supabase
    .from('diagnostics')
    .insert(diagnostic)
    .select()
    .single();

  if (error) throw error;
  return data as Diagnostic;
}

// Get diagnostics count for current month
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

// Increment monthly analysis count in profile
export async function incrementAnalysisCount(): Promise<void> {
  const { error } = await supabase.rpc('increment_analysis_count');
  if (error) {
    // Function might not exist, that's okay - we track via diagnostics table
    console.error('Error incrementing analysis count:', error);
  }
}
