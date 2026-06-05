-- 1. Fix mutable search paths
-- Set search_path to 'public' to prevent search path injection attacks.
ALTER FUNCTION public.update_updated_at() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.auth_user_role() SET search_path = public;
ALTER FUNCTION public.auth_user_dept() SET search_path = public;
ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.is_manager_of(uuid) SET search_path = public;

-- 2. Revoke execute access from trigger functions
-- These only need to be called internally by Postgres triggers.
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;

-- 3. Restrict execute access for RLS functions
-- By default, functions in the public schema can be executed by anyone (PUBLIC).
-- We revoke PUBLIC execution and explicitly grant it only to authenticated users and service_role,
-- which prevents the 'anon' role from calling them while keeping them working for signed-in users evaluating RLS.
REVOKE EXECUTE ON FUNCTION public.auth_user_role() FROM public;
REVOKE EXECUTE ON FUNCTION public.auth_user_dept() FROM public;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM public;
REVOKE EXECUTE ON FUNCTION public.is_manager_of(uuid) FROM public;

GRANT EXECUTE ON FUNCTION public.auth_user_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.auth_user_dept() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_manager_of(uuid) TO authenticated, service_role;
