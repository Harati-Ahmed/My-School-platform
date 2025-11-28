-- =============================================
-- Migration: Make Subjects Global (Optional school_id)
-- =============================================
-- This migration makes subjects global - they can be shared across all schools
-- Subjects can optionally have a school_id (for school-specific subjects)
-- or NULL (for global subjects shared by all schools)

-- Step 1: Make school_id nullable (subjects can be global)
ALTER TABLE subjects 
    ALTER COLUMN school_id DROP NOT NULL;

-- Step 2: Update unique constraint to allow global subjects
-- Drop old constraints/indexes that might exist from previous migrations

-- Drop constraint if it exists (from migration 20240104)
ALTER TABLE subjects 
    DROP CONSTRAINT IF EXISTS subjects_school_id_name_unique;

-- Drop constraint from initial schema if it exists
ALTER TABLE subjects 
    DROP CONSTRAINT IF EXISTS subjects_school_id_class_id_name_key;

-- Also try dropping as an index (in case it was created as an index)
DROP INDEX IF EXISTS subjects_school_id_name_unique;
DROP INDEX IF EXISTS subjects_school_id_class_id_name_key;

-- Drop the unique index we're about to create if it already exists (idempotent)
DROP INDEX IF EXISTS subjects_global_name_unique;

-- Add unique constraint: unique name globally (for global subjects with school_id = NULL)
-- For school-specific subjects, they can have the same name as global subjects
-- We'll use a unique index that allows NULL school_id to have unique names
CREATE UNIQUE INDEX IF NOT EXISTS subjects_global_name_unique 
    ON subjects (name)
    WHERE school_id IS NULL;

-- For school-specific subjects, allow same name across different schools
-- But unique within a school (handled by application logic or separate constraint if needed)

-- Step 3: Add comment
COMMENT ON COLUMN subjects.school_id IS 'Optional: NULL for global subjects (shared by all schools), or specific school_id for school-specific subjects.';

