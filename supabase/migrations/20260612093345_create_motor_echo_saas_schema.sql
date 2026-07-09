-- MotorEcho SaaS Schema - Add authentication and subscription support
-- First, drop existing tables and recreate with user ownership

-- Drop existing foreign keys and tables
DROP TABLE IF EXISTS public.diagnostics CASCADE;
DROP TABLE IF EXISTS public.vehicles CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;

-- 1. PROFILES TABLE (extends auth.users)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  first_name text,
  last_name text,
  plan_type text NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'premium', 'garage')),
  monthly_analysis_count integer NOT NULL DEFAULT 0,
  analysis_count_reset_at timestamptz DEFAULT now(),
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_profile" ON public.profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

CREATE POLICY "users_update_own_profile" ON public.profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "users_insert_own_profile" ON public.profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- 2. VEHICLES TABLE (user-owned)
CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  fuel_type text NOT NULL,
  engine_type text NOT NULL,
  nickname text,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_vehicles" ON public.vehicles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_vehicles" ON public.vehicles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_vehicles" ON public.vehicles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_vehicles" ON public.vehicles FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 3. DIAGNOSTICS TABLE (user-owned analyses)
CREATE TABLE public.diagnostics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  audio_url text,
  result text NOT NULL,
  issue_type text,
  confidence double precision NOT NULL,
  severity text NOT NULL,
  recommendation text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.diagnostics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_diagnostics" ON public.diagnostics FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_diagnostics" ON public.diagnostics FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_diagnostics" ON public.diagnostics FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 4. SUBSCRIPTIONS TABLE
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type text NOT NULL CHECK (plan_type IN ('free', 'premium', 'garage')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  price_monthly decimal(10,2),
  price_yearly decimal(10,2),
  billing_cycle text CHECK (billing_cycle IN ('monthly', 'yearly')),
  started_at timestamptz DEFAULT now(),
  renewal_date timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_subscription" ON public.subscriptions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_subscription" ON public.subscriptions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_subscription" ON public.subscriptions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. FUNCTION: Check plan limits
CREATE OR REPLACE FUNCTION public.check_plan_limits(
  p_user_id uuid,
  p_action text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile record;
  v_vehicle_count integer;
  v_analysis_count integer;
BEGIN
  SELECT plan_type, monthly_analysis_count, analysis_count_reset_at INTO v_profile
  FROM public.profiles WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('allowed', false, 'reason', 'Profile not found');
  END IF;
  
  -- Reset monthly counter if needed
  IF v_profile.analysis_count_reset_at < date_trunc('month', now()) THEN
    UPDATE public.profiles 
    SET monthly_analysis_count = 0, analysis_count_reset_at = now()
    WHERE id = p_user_id;
    v_profile.monthly_analysis_count := 0;
  END IF;
  
  SELECT COUNT(*) INTO v_vehicle_count FROM public.vehicles WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_analysis_count FROM public.diagnostics 
  WHERE user_id = p_user_id AND created_at >= date_trunc('month', now());
  
  IF p_action = 'add_vehicle' THEN
    IF v_profile.plan_type = 'free' AND v_vehicle_count >= 1 THEN
      RETURN json_build_object(
        'allowed', false, 
        'reason', 'Free plan limited to 1 vehicle',
        'upgrade_to', 'premium',
        'current_count', v_vehicle_count,
        'max_count', 1
      );
    ELSIF v_profile.plan_type = 'premium' AND v_vehicle_count >= 2 THEN
      RETURN json_build_object(
        'allowed', false, 
        'reason', 'Premium plan limited to 2 vehicles',
        'upgrade_to', 'garage',
        'current_count', v_vehicle_count,
        'max_count', 2
      );
    END IF;
    
  ELSIF p_action = 'analyze' THEN
    IF v_profile.plan_type = 'free' AND v_analysis_count >= 3 THEN
      RETURN json_build_object(
        'allowed', false, 
        'reason', 'Free plan limited to 3 analyses per month',
        'upgrade_to', 'premium',
        'current_count', v_analysis_count,
        'max_count', 3
      );
    END IF;
  END IF;
  
  RETURN json_build_object('allowed', true, 'plan', v_profile.plan_type);
END;
$$;

-- 6. FUNCTION: Get user plan details
CREATE OR REPLACE FUNCTION public.get_user_plan_details(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile record;
  v_vehicle_count integer;
  v_monthly_analyses integer;
  v_max_vehicles integer;
  v_max_analyses integer;
BEGIN
  SELECT plan_type, monthly_analysis_count INTO v_profile
  FROM public.profiles WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('plan', 'free');
  END IF;
  
  SELECT COUNT(*) INTO v_vehicle_count FROM public.vehicles WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_monthly_analyses FROM public.diagnostics 
  WHERE user_id = p_user_id AND created_at >= date_trunc('month', now());
  
  CASE v_profile.plan_type
    WHEN 'free' THEN
      v_max_vehicles := 1;
      v_max_analyses := 3;
    WHEN 'premium' THEN
      v_max_vehicles := 2;
      v_max_analyses := -1;
    WHEN 'garage' THEN
      v_max_vehicles := -1;
      v_max_analyses := -1;
  END CASE;
  
  RETURN json_build_object(
    'plan', v_profile.plan_type,
    'vehicle_count', v_vehicle_count,
    'max_vehicles', v_max_vehicles,
    'monthly_analyses', v_monthly_analyses,
    'max_analyses', v_max_analyses
  );
END;
$$;

-- 7. TRIGGER: Create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, plan_type)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    'free'
  );
  
  INSERT INTO public.subscriptions (user_id, plan_type, status)
  VALUES (NEW.id, 'free', 'active');
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. INDEXES
CREATE INDEX idx_vehicles_user_id ON public.vehicles(user_id);
CREATE INDEX idx_diagnostics_user_id ON public.diagnostics(user_id);
CREATE INDEX idx_diagnostics_vehicle_id ON public.diagnostics(vehicle_id);
CREATE INDEX idx_diagnostics_created_at ON public.diagnostics(created_at DESC);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);