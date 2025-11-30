-- =============================================
-- Migration: Allow School Creation During Onboarding
-- =============================================
-- This migration allows authenticated users to create schools during onboarding
-- when they don't have a profile yet (for new admin users setting up their school)

-- Allow authenticated users to create schools (for onboarding)
-- This is safe because:
-- 1. Only authenticated users can create (auth.uid() must exist)
-- 2. Users will link to the school when creating their profile
-- 3. RLS policies on other tables will prevent unauthorized access
CREATE POLICY "Authenticated users can create schools during onboarding"
  ON schools FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if user is authenticated (has auth.uid())
    auth.uid() IS NOT NULL
  );

-- Add comment
COMMENT ON POLICY "Authenticated users can create schools during onboarding" ON schools IS 
  'Allows authenticated users to create schools during onboarding. This enables new admin users to set up their school before their profile is created.';

