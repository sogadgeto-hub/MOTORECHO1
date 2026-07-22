import { fetchVehicles } from './db';
import { supabase } from './supabase';
import type { Profile } from './auth';

export type PostOnboardingRoute = '/(tabs)' | '/vehicle-setup';

/** Route après paiement / skip onboarding — évite de renvoyer vers payment en boucle. */
export async function resolvePostOnboardingRoute(
  userId: string,
  profile: Profile | null
): Promise<PostOnboardingRoute> {
  if (profile?.onboarding_completed) {
    return '/(tabs)';
  }

  try {
    const vehicles = await fetchVehicles();
    if (vehicles.length > 0) {
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true, updated_at: new Date().toISOString() })
        .eq('id', userId);

      return '/(tabs)';
    }
  } catch {
    // fall through to vehicle setup
  }

  return '/vehicle-setup';
}

/** Bêta interne — pas de paiement réel, plan Free temporaire. */
export async function finalizeBetaOnboardingStep(
  userId: string,
  updatePlan: (plan: 'free') => Promise<{ error: string | null }>,
  refreshProfile: () => Promise<void>,
  profile: Profile | null
): Promise<PostOnboardingRoute> {
  await updatePlan('free');
  const route = await resolvePostOnboardingRoute(userId, profile);
  await refreshProfile();
  return route;
}
