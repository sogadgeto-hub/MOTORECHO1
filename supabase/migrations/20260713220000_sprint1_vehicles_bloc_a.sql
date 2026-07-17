-- ============================================================
-- MotorEcho Sprint 1 — PR1 Bloc A
-- Stabilisation véhicules / marques
-- Idempotent : safe to re-run
-- ============================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- A1. Index : recherche rapide du véhicule primaire par user
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS vehicles_user_primary_idx
  ON public.vehicles (user_id, is_primary)
  WHERE is_primary = true;

-- ─────────────────────────────────────────────────────────────
-- A2. Contrainte : un seul véhicule primaire par utilisateur
--     Échoue si des doublons existent déjà → voir note ci-dessous
-- ─────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS vehicles_one_primary_per_user
  ON public.vehicles (user_id)
  WHERE is_primary = true;

-- ─────────────────────────────────────────────────────────────
-- A3. Index brand_id (déjà créé par migration brands, sécurité)
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS vehicles_brand_id_idx
  ON public.vehicles (brand_id);

-- ─────────────────────────────────────────────────────────────
-- A4. Fonction serveur : définir le véhicule primaire
--     Remplace la logique client fragile de setPrimaryVehicle()
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_primary_vehicle(p_vehicle_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.vehicles
    WHERE id = p_vehicle_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Vehicle not found or access denied';
  END IF;

  UPDATE public.vehicles
  SET is_primary = false, updated_at = now()
  WHERE user_id = v_user_id AND is_primary = true;

  UPDATE public.vehicles
  SET is_primary = true, updated_at = now()
  WHERE id = p_vehicle_id AND user_id = v_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.set_primary_vehicle(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_primary_vehicle(uuid) TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- A5. Trigger : auto user_id sur INSERT véhicule (defense in depth)
--     Ne modifie pas les lignes existantes
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_vehicle_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required';
  END IF;
  IF NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'user_id must match authenticated user';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS vehicles_set_user_id ON public.vehicles;
CREATE TRIGGER vehicles_set_user_id
  BEFORE INSERT ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_vehicle_user_id();

-- ─────────────────────────────────────────────────────────────
-- A6. Re-seed marques (idempotent, ne touche pas aux existantes)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.brands (name, country) VALUES
  ('Peugeot',        'France'),
  ('Renault',        'France'),
  ('Citroën',        'France'),
  ('DS Automobiles', 'France'),
  ('Alpine',         'France'),
  ('Audi',           'Germany'),
  ('BMW',            'Germany'),
  ('Mercedes-Benz',  'Germany'),
  ('Volkswagen',     'Germany'),
  ('Opel',           'Germany'),
  ('Porsche',        'Germany'),
  ('Smart',          'Germany'),
  ('Alfa Romeo',     'Italy'),
  ('Ferrari',        'Italy'),
  ('Fiat',           'Italy'),
  ('Lamborghini',    'Italy'),
  ('Lancia',         'Italy'),
  ('Maserati',       'Italy'),
  ('Honda',          'Japan'),
  ('Lexus',          'Japan'),
  ('Mazda',          'Japan'),
  ('Mitsubishi',     'Japan'),
  ('Nissan',         'Japan'),
  ('Subaru',         'Japan'),
  ('Suzuki',         'Japan'),
  ('Toyota',         'Japan'),
  ('Infiniti',       'Japan'),
  ('Daihatsu',       'Japan'),
  ('Genesis',        'South Korea'),
  ('Hyundai',        'South Korea'),
  ('Kia',            'South Korea'),
  ('Cadillac',       'USA'),
  ('Chevrolet',      'USA'),
  ('Dodge',          'USA'),
  ('Ford',           'USA'),
  ('GMC',            'USA'),
  ('Jeep',           'USA'),
  ('Lincoln',        'USA'),
  ('Ram',            'USA'),
  ('Tesla',          'USA'),
  ('Aston Martin',   'United Kingdom'),
  ('Bentley',        'United Kingdom'),
  ('Jaguar',         'United Kingdom'),
  ('Land Rover',     'United Kingdom'),
  ('MINI',           'United Kingdom'),
  ('Rolls-Royce',    'United Kingdom'),
  ('Volvo',          'Sweden'),
  ('SAAB',           'Sweden'),
  ('Polestar',       'Sweden'),
  ('Skoda',          'Czech Republic'),
  ('SEAT',           'Spain'),
  ('Cupra',          'Spain'),
  ('Dacia',          'Romania'),
  ('Lada',           'Russia'),
  ('BYD',            'China'),
  ('MG',             'China'),
  ('Geely',          'China'),
  ('NIO',            'China'),
  ('Datsun',         'Japan'),
  ('Isuzu',          'Japan'),
  ('Acura',          'Japan'),
  ('SsangYong',      'South Korea'),
  ('Chrysler',       'USA'),
  ('Buick',          'USA'),
  ('Rivian',         'USA'),
  ('Lucid',          'USA')
ON CONFLICT (name) DO NOTHING;

COMMIT;
