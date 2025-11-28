-- =============================================
-- Add HR Role to User Role Enum - Part 2
-- =============================================
-- Run this AFTER 20241201_add_hr_role.sql has been committed
-- This creates the helper function and RLS policies for HR role

-- Drop policies if they exist (in case first migration partially ran)
DROP POLICY IF EXISTS "HR can mark attendance" ON attendance;
DROP POLICY IF EXISTS "HR can update attendance" ON attendance;
DROP POLICY IF EXISTS "HR can view attendance" ON attendance;
DROP POLICY IF EXISTS "HR can view classes" ON classes;
DROP POLICY IF EXISTS "HR can view students" ON students;

-- Add helper function to check if user is HR
CREATE OR REPLACE FUNCTION public.auth_is_hr()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM users
    WHERE id = (SELECT auth.uid())
      AND role = 'hr'
  );
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.auth_is_hr() TO authenticated;

-- Create RLS policies to allow HR to mark attendance
-- HR can mark attendance for all classes in their school
CREATE POLICY "HR can mark attendance"
ON attendance
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid())
    AND role = 'hr'
    AND school_id = attendance.school_id
  )
);

CREATE POLICY "HR can update attendance"
ON attendance
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid())
    AND role = 'hr'
    AND school_id = attendance.school_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid())
    AND role = 'hr'
    AND school_id = attendance.school_id
  )
);

-- HR can view attendance for all classes in their school
CREATE POLICY "HR can view attendance"
ON attendance
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid())
    AND role = 'hr'
    AND school_id = attendance.school_id
  )
);

-- HR can view all classes in their school
CREATE POLICY "HR can view classes"
ON classes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid())
    AND role = 'hr'
    AND school_id = classes.school_id
  )
);

-- HR can view all students in their school
CREATE POLICY "HR can view students"
ON students
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid())
    AND role = 'hr'
    AND school_id = students.school_id
  )
);

