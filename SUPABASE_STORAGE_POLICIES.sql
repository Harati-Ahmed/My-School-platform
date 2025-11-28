-- ============================================================================
-- SUPABASE STORAGE BUCKETS AND POLICIES
-- For Phase 5 File Upload Features
-- ============================================================================

-- Create Storage Buckets
-- ============================================================================

-- 1. Homework Bucket (Public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'homework',
  'homework',
  true,
  10485760, -- 10MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 2. School Bucket (Public - for logos, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'school',
  'school',
  true,
  2097152, -- 2MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/svg+xml'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 3. Profiles Bucket (Public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profiles',
  'profiles',
  true,
  2097152, -- 2MB
  ARRAY[
    'image/jpeg',
    'image/png'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 4. Documents Bucket (Private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  20971520, -- 20MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- ============================================================================

-- HOMEWORK BUCKET POLICIES
-- ============================================================================

-- Allow public read access to homework files
CREATE POLICY "Public Access to Homework Files"
ON storage.objects FOR SELECT
USING (bucket_id = 'homework');

-- Allow authenticated users to upload homework files
CREATE POLICY "Authenticated Users Can Upload Homework"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'homework' AND
  auth.role() = 'authenticated'
);

-- Allow users to update their own uploads
CREATE POLICY "Users Can Update Own Homework Files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'homework' AND
  auth.uid() = owner
);

-- Allow users to delete their own uploads
CREATE POLICY "Users Can Delete Own Homework Files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'homework' AND
  auth.uid() = owner
);

-- SCHOOL BUCKET POLICIES
-- ============================================================================

-- Allow public read access to school files (logos, etc.)
CREATE POLICY "Public Access to School Files"
ON storage.objects FOR SELECT
USING (bucket_id = 'school');

-- Only admins can upload school files
CREATE POLICY "Admins Can Upload School Files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'school' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Only admins can update school files
CREATE POLICY "Admins Can Update School Files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'school' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Only admins can delete school files
CREATE POLICY "Admins Can Delete School Files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'school' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- PROFILES BUCKET POLICIES
-- ============================================================================

-- Allow public read access to profile pictures
CREATE POLICY "Public Access to Profile Pictures"
ON storage.objects FOR SELECT
USING (bucket_id = 'profiles');

-- Allow authenticated users to upload their own profile picture
CREATE POLICY "Users Can Upload Own Profile Picture"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profiles' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own profile picture
CREATE POLICY "Users Can Update Own Profile Picture"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profiles' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own profile picture
CREATE POLICY "Users Can Delete Own Profile Picture"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profiles' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- DOCUMENTS BUCKET POLICIES (Private)
-- ============================================================================

-- Only authenticated users can read documents
CREATE POLICY "Authenticated Users Can Read Documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  auth.role() = 'authenticated'
);

-- Only authenticated users can upload documents
CREATE POLICY "Authenticated Users Can Upload Documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  auth.role() = 'authenticated'
);

-- Users can update their own documents
CREATE POLICY "Users Can Update Own Documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents' AND
  auth.uid() = owner
);

-- Users can delete their own documents
CREATE POLICY "Users Can Delete Own Documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  auth.uid() = owner
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if buckets were created successfully
-- SELECT * FROM storage.buckets WHERE id IN ('homework', 'school', 'profiles', 'documents');

-- Check if policies were created successfully
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- Test file upload (replace with actual file)
-- Example: Upload a test file to homework bucket
-- const { data, error } = await supabase.storage
--   .from('homework')
--   .upload('test.pdf', file);

-- ============================================================================
-- CLEANUP (Run only if you need to reset)
-- ============================================================================

-- -- Drop all policies
-- DROP POLICY IF EXISTS "Public Access to Homework Files" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated Users Can Upload Homework" ON storage.objects;
-- DROP POLICY IF EXISTS "Users Can Update Own Homework Files" ON storage.objects;
-- DROP POLICY IF EXISTS "Users Can Delete Own Homework Files" ON storage.objects;
-- DROP POLICY IF EXISTS "Public Access to School Files" ON storage.objects;
-- DROP POLICY IF EXISTS "Admins Can Upload School Files" ON storage.objects;
-- DROP POLICY IF EXISTS "Admins Can Update School Files" ON storage.objects;
-- DROP POLICY IF EXISTS "Admins Can Delete School Files" ON storage.objects;
-- DROP POLICY IF EXISTS "Public Access to Profile Pictures" ON storage.objects;
-- DROP POLICY IF EXISTS "Users Can Upload Own Profile Picture" ON storage.objects;
-- DROP POLICY IF EXISTS "Users Can Update Own Profile Picture" ON storage.objects;
-- DROP POLICY IF EXISTS "Users Can Delete Own Profile Picture" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated Users Can Read Documents" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated Users Can Upload Documents" ON storage.objects;
-- DROP POLICY IF EXISTS "Users Can Update Own Documents" ON storage.objects;
-- DROP POLICY IF EXISTS "Users Can Delete Own Documents" ON storage.objects;

-- -- Delete buckets
-- DELETE FROM storage.buckets WHERE id IN ('homework', 'school', 'profiles', 'documents');

