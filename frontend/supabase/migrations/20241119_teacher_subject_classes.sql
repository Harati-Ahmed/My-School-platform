-- =============================================
-- Migration: Teacher Subject Class Assignments
-- =============================================
-- This migration creates a junction table to allow multiple teachers
-- to teach the same subject for different classes
-- Example: Teacher A teaches Arabic to Class 1, Teacher B teaches Arabic to Class 3

-- Step 1: Create junction table for teacher-subject-class assignments
CREATE TABLE IF NOT EXISTS teacher_subject_classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(teacher_id, subject_id, class_id, school_id)
);

-- Step 2: Create indexes for performance
CREATE INDEX idx_teacher_subject_classes_teacher ON teacher_subject_classes(teacher_id);
CREATE INDEX idx_teacher_subject_classes_subject ON teacher_subject_classes(subject_id);
CREATE INDEX idx_teacher_subject_classes_class ON teacher_subject_classes(class_id);
CREATE INDEX idx_teacher_subject_classes_school ON teacher_subject_classes(school_id);

-- Step 3: Migrate existing teacher-subject assignments
-- For subjects with teacher_id set, create entries in the junction table
-- If subject has class_id, use it; otherwise, create entries for all classes in the school
INSERT INTO teacher_subject_classes (teacher_id, subject_id, class_id, school_id)
SELECT DISTINCT
    s.teacher_id,
    s.id as subject_id,
    CASE 
        WHEN s.class_id IS NOT NULL THEN s.class_id
        ELSE NULL -- NULL means teacher teaches this subject for all classes
    END as class_id,
    COALESCE(s.school_id, (SELECT school_id FROM users WHERE id = s.teacher_id LIMIT 1)) as school_id
FROM subjects s
WHERE s.teacher_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Step 4: Make teacher_id nullable on subjects (subjects are now shared)
-- Keep teacher_id for backward compatibility but it's no longer the primary assignment method
COMMENT ON COLUMN subjects.teacher_id IS 'Deprecated: Use teacher_subject_classes table instead. Kept for backward compatibility.';

-- Step 5: Add RLS policies for the new table
ALTER TABLE teacher_subject_classes ENABLE ROW LEVEL SECURITY;

-- Policy: Teachers can view their own assignments
CREATE POLICY "Teachers can view their own subject-class assignments"
    ON teacher_subject_classes
    FOR SELECT
    USING (
        teacher_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin' AND school_id = teacher_subject_classes.school_id
        )
    );

-- Policy: Admins can manage all assignments in their school
CREATE POLICY "Admins can manage subject-class assignments in their school"
    ON teacher_subject_classes
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin' AND school_id = teacher_subject_classes.school_id
        )
    );

-- Step 6: Add comment to document the table
COMMENT ON TABLE teacher_subject_classes IS 'Junction table linking teachers to subjects and classes. Allows multiple teachers to teach the same subject for different classes. NULL class_id means the teacher teaches the subject for all classes in the school.';

