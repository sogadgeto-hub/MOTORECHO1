import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { Session, User } from '@supabase/supabase-js';

export type Profile = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  plan_type: 'free' | 'premium' | 'garage';
  monthly_analysis_count: number;
  analysis_count_reset_at: string;
  onboarding_completed: boolean;
  allow_ai_training: boolean;
  language_preference: 'fr' | 'en';
  created_at: string;
  updated_at: string;
};

export type PlanDetails = {
  plan: 'free' | 'premium' | 'garage';
  vehicle_count: number;
  max_vehicles: number;
  monthly_analyses: number;
  max_analyses: number;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  planDetails: PlanDetails | null;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
  updatePlan: (plan: 'free' | 'premium' | 'garage') => Promise<{ error: string | null }>;
  checkLimit: (action: 'add_vehicle' | 'analyze') => Promise<{ allowed: boolean; reason?: string; upgrade_to?: string }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [planDetails, setPlanDetails] = useState<PlanDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setPlanDetails(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      const profileData = data as Profile;
      setProfile(profileData);

      // Sync language preference from profile to local storage
      if (profileData.language_preference) {
        await AsyncStorage.setItem('@motorecho_language', profileData.language_preference);
      }

      // Fetch plan details
      const { data: planData, error: planError } = await supabase
        .rpc('get_user_plan_details', { p_user_id: userId });

      if (!planError && planData) {
        setPlanDetails(planData as PlanDetails);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  }

  async function refreshProfile() {
    if (user) {
      await fetchProfile(user.id);
    }
  }

  async function signUp(email: string, password: string, firstName?: string, lastName?: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName || '',
            last_name: lastName || '',
          },
        },
      });

      if (error) return { error: error.message };
      return { error: null };
    } catch (err) {
      return { error: 'An unexpected error occurred' };
    }
  }

  async function signIn(email: string, password: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error: error.message };
      return { error: null };
    } catch (err) {
      return { error: 'An unexpected error occurred' };
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setPlanDetails(null);
  }

  async function resetPassword(email: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'motorecho://reset-password',
      });

      if (error) return { error: error.message };
      return { error: null };
    } catch (err) {
      return { error: 'An unexpected error occurred' };
    }
  }

  async function updatePlan(plan: 'free' | 'premium' | 'garage'): Promise<{ error: string | null }> {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ plan_type: plan, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) return { error: error.message };

      await refreshProfile();
      return { error: null };
    } catch (err) {
      return { error: 'An unexpected error occurred' };
    }
  }

  async function checkLimit(action: 'add_vehicle' | 'analyze'): Promise<{ allowed: boolean; reason?: string; upgrade_to?: string }> {
    if (!user) return { allowed: false, reason: 'Not authenticated' };

    try {
      const { data, error } = await supabase.rpc('check_plan_limits', {
        p_user_id: user.id,
        p_action: action,
      });

      if (error) return { allowed: false, reason: error.message };

      return {
        allowed: data.allowed,
        reason: data.reason,
        upgrade_to: data.upgrade_to,
      };
    } catch (err) {
      return { allowed: false, reason: 'An unexpected error occurred' };
    }
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        planDetails,
        signUp,
        signIn,
        signOut,
        resetPassword,
        refreshProfile,
        updatePlan,
        checkLimit,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
