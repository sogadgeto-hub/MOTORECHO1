
-- Community stats function (security definer to bypass RLS for aggregates)
CREATE OR REPLACE FUNCTION get_community_stats()
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'total_analyses', COUNT(*),
    'total_users', COUNT(DISTINCT user_id),
    'confirmed_diagnoses', COUNT(*) FILTER (WHERE user_confirmed = 'yes')
  )
  FROM diagnostics;
$$;

GRANT EXECUTE ON FUNCTION get_community_stats() TO anon, authenticated;
