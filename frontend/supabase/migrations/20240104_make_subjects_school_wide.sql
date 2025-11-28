-- =============================================
-- Migration: Make Subjects School-Wide
-- =============================================
-- This migration makes subjects belong to schools instead of classes
-- This simplifies the UX for teachers and managers - they create each subject once per school
-- instead of once per class.

-- Step 1: Make class_id nullable (subjects can exist without a specific class)
ALTER TABLE subjects 
    ALTER COLUMN class_id DROP NOT NULL;

-- Step 2: Drop the old unique constraint that included class_id
ALTER TABLE subjects 
    DROP CONSTRAINT IF EXISTS subjects_school_id_class_id_name_key;

-- Step 3: Clean up duplicate subjects - keep only one subject per school/name combination
-- Delete duplicates, keeping the one with the earliest created_at
DELETE FROM subjects s1
WHERE EXISTS (
    SELECT 1 FROM subjects s2
    WHERE s2.school_id = s1.school_id
      AND s2.name = s1.name
      AND s2.id < s1.id
);

-- Step 4: Set class_id to NULL for all subjects (making them school-wide)
UPDATE subjects SET class_id = NULL WHERE class_id IS NOT NULL;

-- Step 5: Add new unique constraint: one subject name per school
ALTER TABLE subjects 
    ADD CONSTRAINT subjects_school_id_name_unique UNIQUE(school_id, name);

-- Step 5: Add comment to document the change
COMMENT ON COLUMN subjects.class_id IS 'Optional: Can be NULL. Subjects are school-wide, but can optionally be assigned to a specific class for organization purposes.';

