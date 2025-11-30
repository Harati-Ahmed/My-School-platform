-- =============================================
-- Migration: Fix RLS policies for newly created users
-- =============================================
-- This migration ensures that newly created admin users can access
-- their school's data immediately after onboarding

-- Ensure auth_current_context function handles NULL cases gracefully
CREATE OR REPLACE FUNCTION public.auth_current_context()
RETURNS TABLE (
  uid UUID,
  school_id UUID,
  is_admin BOOLEAN,
  is_teacher BOOLEAN,
  is_parent BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    (SELECT auth.uid()) AS uid,
    (SELECT public.auth_user_school_id()) AS school_id,
    (SELECT public.auth_is_admin()) AS is_admin,
    (SELECT public.auth_is_teacher()) AS is_teacher,
    (SELECT public.auth_is_parent()) AS is_parent;
$$;

-- Ensure auth_user_school_id handles cases where user might not exist yet
CREATE OR REPLACE FUNCTION public.auth_user_school_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT school_id
  FROM users
  WHERE id = (SELECT auth.uid());
$$;

-- Ensure auth_is_admin works correctly
CREATE OR REPLACE FUNCTION public.auth_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM users
    WHERE id = (SELECT auth.uid())
      AND role = 'admin'
  );
$$;

-- Add fallback policies that use simpler functions
-- These work alongside existing policies (PostgreSQL RLS uses OR logic)

-- Fallback policy for subjects (allows admins to see their school's subjects and global subjects)
DROP POLICY IF EXISTS "subjects_select_admin_fallback" ON subjects;
CREATE POLICY "subjects_select_admin_fallback"
  ON subjects
  FOR SELECT
  TO authenticated
  USING (
    public.auth_is_admin() 
    AND (
      school_id = public.auth_user_school_id()
      OR school_id IS NULL  -- Global subjects
    )
  );

-- Fallback policy for classes (allows admins to see their school's classes)
DROP POLICY IF EXISTS "classes_select_admin_fallback" ON classes;
CREATE POLICY "classes_select_admin_fallback"
  ON classes
  FOR SELECT
  TO authenticated
  USING (
    public.auth_is_admin() 
    AND school_id = public.auth_user_school_id()
  );

-- Fallback policy for students (allows admins to see their school's students)
DROP POLICY IF EXISTS "students_select_admin_fallback" ON students;
CREATE POLICY "students_select_admin_fallback"
  ON students
  FOR SELECT
  TO authenticated
  USING (
    public.auth_is_admin() 
    AND school_id = public.auth_user_school_id()
  );

-- Fallback policy for user creation (allows admins to create users in their school)
DROP POLICY IF EXISTS "users_insert_admin_fallback" ON users;
CREATE POLICY "users_insert_admin_fallback"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.auth_is_admin() 
    AND school_id = public.auth_user_school_id()
  );

-- Add comment
COMMENT ON FUNCTION public.auth_current_context() IS 
  'Returns the current user context including uid, school_id, and role flags. Used by RLS policies.';

