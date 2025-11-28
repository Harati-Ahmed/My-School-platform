-- ============================================================================
-- SUPABASE STORAGE SETUP - RUN THIS IN SUPABASE SQL EDITOR
-- ============================================================================

-- Step 1: Create the 'school' bucket if it doesn't exist
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'school',
  'school',
  true,  -- Important: must be public for logos to display
  2097152, -- 2MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/svg+xml'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/svg+xml'
  ];

-- Step 2: Drop existing policies (if any)
-- ============================================================================
DROP POLICY IF EXISTS "Public Access to School Files" ON storage.objects;
DROP POLICY IF EXISTS "Admins Can Upload School Files" ON storage.objects;
DROP POLICY IF EXISTS "Admins Can Update School Files" ON storage.objects;
DROP POLICY IF EXISTS "Admins Can Delete School Files" ON storage.objects;

-- Step 3: Create policies for the school bucket
-- ============================================================================

-- Allow EVERYONE to view school files (logos need to be publicly visible)
CREATE POLICY "Public Access to School Files"
ON storage.objects FOR SELECT
USING (bucket_id = 'school');

-- Allow authenticated admins to upload school files
CREATE POLICY "Admins Can Upload School Files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'school' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Allow authenticated admins to update school files
CREATE POLICY "Admins Can Update School Files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'school' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'school' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Allow authenticated admins to delete school files
CREATE POLICY "Admins Can Delete School Files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'school' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Step 4: Verify the setup
-- ============================================================================
-- Run these queries to verify everything is set up correctly:

-- Check if bucket exists and is public
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'school';

-- Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%School%';

-- ============================================================================
-- DONE! Now try uploading a logo again from the admin settings page
-- ============================================================================

