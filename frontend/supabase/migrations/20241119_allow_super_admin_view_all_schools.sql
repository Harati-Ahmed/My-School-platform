-- =============================================
-- Migration: Allow Super Admins to View All Schools
-- =============================================
-- This migration allows super admins (users with school_id = NULL) 
-- to view all schools, while regular admins can only see their own school

-- Drop existing restrictive policy for admins
DROP POLICY IF EXISTS "Admins can view their school" ON schools;

-- Create new policy: Super admins (school_id = NULL) can view all schools
-- Regular admins can only view their own school
CREATE POLICY "Admins can view schools"
  ON schools FOR SELECT
  USING (
    -- Super admin: school_id is NULL, can see all schools
    (public.auth_is_admin() AND public.auth_user_school_id() IS NULL)
    OR
    -- Regular admin: can only see their own school
    (public.auth_is_admin() AND id = public.auth_user_school_id())
    OR
    -- Regular users can see their own school
    (id = public.auth_user_school_id())
  );

-- Add comment
COMMENT ON POLICY "Admins can view schools" ON schools IS 
  'Super admins (school_id = NULL) can view all schools. Regular admins and users can only view their own school.';

