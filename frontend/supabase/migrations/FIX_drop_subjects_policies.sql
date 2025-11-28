-- =============================================
-- QUICK FIX: Drop Subjects Policies
-- =============================================
-- Run this BEFORE migration 20240106 if you get
-- "policy already exists" error
-- =============================================

-- Drop all subjects-related policies that might conflict
DROP POLICY IF EXISTS "subjects_select_authenticated" ON subjects;
DROP POLICY IF EXISTS "subjects_insert_authorized" ON subjects;
DROP POLICY IF EXISTS "subjects_update_authorized" ON subjects;
DROP POLICY IF EXISTS "subjects_delete_authorized" ON subjects;
DROP POLICY IF EXISTS "Users can view subjects" ON subjects;
DROP POLICY IF EXISTS "Parents can view their children's subjects" ON subjects;
DROP POLICY IF EXISTS "Teachers can view their subjects" ON subjects;
DROP POLICY IF EXISTS "Teachers can manage their subjects" ON subjects;
DROP POLICY IF EXISTS "Admins can manage subjects" ON subjects;

-- Verify policies are dropped
SELECT policyname, tablename 
FROM pg_policies 
WHERE tablename = 'subjects'
ORDER BY policyname;

