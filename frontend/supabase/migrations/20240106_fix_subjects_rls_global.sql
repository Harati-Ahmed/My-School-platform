-- =============================================
-- Migration: Fix RLS Policy for Global Subjects
-- =============================================
-- This migration updates the subjects RLS policy to allow admins
-- and teachers to view global subjects (school_id IS NULL)
--
-- IMPORTANT: If migration 20241112_refine_rls_policies.sql was already run,
-- this migration may conflict. If you get a "policy already exists" error,
-- you can either:
-- 1. Skip this migration (20241112 already creates similar policies)
-- 2. Or manually drop the policy first:
--    DROP POLICY IF EXISTS "subjects_select_authenticated" ON subjects;
--
-- Note: This uses helper functions that should exist. If they don't,
-- you may need to run the 20241112_refine_rls_policies.sql migration first.

-- Ensure helper functions exist (create if they don't)
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

CREATE OR REPLACE FUNCTION public.auth_is_teacher()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM users
    WHERE id = (SELECT auth.uid())
      AND role = 'teacher'
  );
$$;

CREATE OR REPLACE FUNCTION public.auth_is_parent()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM users
    WHERE id = (SELECT auth.uid())
      AND role = 'parent'
  );
$$;

-- Drop the existing policies (from various migrations)
-- Drop policies that might exist from migration 20240102
DROP POLICY IF EXISTS "Users can view subjects" ON subjects;
DROP POLICY IF EXISTS "Parents can view their children's subjects" ON subjects;
DROP POLICY IF EXISTS "Teachers can view their subjects" ON subjects;
DROP POLICY IF EXISTS "Teachers can manage their subjects" ON subjects;
DROP POLICY IF EXISTS "Admins can manage subjects" ON subjects;

-- Drop policies that might exist from migration 20241112 or previous runs
-- IMPORTANT: Drop these policies before creating new ones
-- If you get an error that policy already exists, manually drop it first:
-- DROP POLICY IF EXISTS "subjects_select_authenticated" ON subjects;
DROP POLICY IF EXISTS "subjects_select_authenticated" ON subjects;
DROP POLICY IF EXISTS "subjects_insert_authorized" ON subjects;
DROP POLICY IF EXISTS "subjects_update_authorized" ON subjects;
DROP POLICY IF EXISTS "subjects_delete_authorized" ON subjects;

-- Recreate the policy to allow global subjects
CREATE POLICY "subjects_select_authenticated"
  ON subjects
  FOR SELECT
  TO authenticated
  USING (
    -- Admins can see global subjects (school_id IS NULL) OR subjects from their school
    (public.auth_is_admin() AND (school_id IS NULL OR school_id = public.auth_user_school_id()))
    -- Teachers can see subjects assigned to them OR subjects from their school OR global subjects
    OR (public.auth_is_teacher() AND (
      teacher_id = auth.uid() 
      OR school_id = public.auth_user_school_id() 
      OR school_id IS NULL
    ))
    -- Parents can see subjects for their children's classes
    OR (
      public.auth_is_parent() AND EXISTS (
        SELECT 1
        FROM students st
        WHERE st.parent_id = auth.uid()
          AND st.class_id = subjects.class_id
      )
    )
  );

-- Also update the insert policy to allow admins to create global subjects
-- (Already dropped above, but keeping for clarity)
DROP POLICY IF EXISTS "subjects_insert_authorized" ON subjects;

CREATE POLICY "subjects_insert_authorized"
  ON subjects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Admins can create global subjects (school_id IS NULL) OR school-specific subjects
    (public.auth_is_admin() AND (school_id IS NULL OR school_id = public.auth_user_school_id()))
    -- Teachers can create subjects assigned to them in their school
    OR (public.auth_is_teacher() AND teacher_id = auth.uid() AND school_id = public.auth_user_school_id())
  );

-- Update the update policy to allow admins to update global subjects
-- (Already dropped above, but keeping for clarity)
DROP POLICY IF EXISTS "subjects_update_authorized" ON subjects;

CREATE POLICY "subjects_update_authorized"
  ON subjects
  FOR UPDATE
  TO authenticated
  USING (
    -- Admins can update global subjects (school_id IS NULL) OR subjects from their school
    (public.auth_is_admin() AND (school_id IS NULL OR school_id = public.auth_user_school_id()))
    -- Teachers can update subjects assigned to them
    OR (public.auth_is_teacher() AND teacher_id = auth.uid())
  )
  WITH CHECK (
    -- Admins can update global subjects (school_id IS NULL) OR subjects from their school
    (public.auth_is_admin() AND (school_id IS NULL OR school_id = public.auth_user_school_id()))
    -- Teachers can update subjects assigned to them
    OR (public.auth_is_teacher() AND teacher_id = auth.uid())
  );

-- Update the delete policy to allow admins to delete global subjects
-- (Already dropped above, but keeping for clarity)
DROP POLICY IF EXISTS "subjects_delete_authorized" ON subjects;

CREATE POLICY "subjects_delete_authorized"
  ON subjects
  FOR DELETE
  TO authenticated
  USING (
    -- Admins can delete global subjects (school_id IS NULL) OR subjects from their school
    (public.auth_is_admin() AND (school_id IS NULL OR school_id = public.auth_user_school_id()))
    -- Teachers can delete subjects assigned to them
    OR (public.auth_is_teacher() AND teacher_id = auth.uid())
  );

