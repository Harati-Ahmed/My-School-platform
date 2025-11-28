-- =============================================
-- Migration: Teacher Class Assignments
-- =============================================
-- Stores which specific classes a teacher is allowed to teach.
-- Complements teacher_grade_levels (years) and teacher_subject_classes (subjects).

CREATE TABLE IF NOT EXISTS teacher_class_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (teacher_id, class_id, school_id)
);

CREATE INDEX IF NOT EXISTS idx_teacher_class_assignments_teacher ON teacher_class_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_class_assignments_class ON teacher_class_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_teacher_class_assignments_school ON teacher_class_assignments(school_id);

ALTER TABLE teacher_class_assignments ENABLE ROW LEVEL SECURITY;

-- Teachers can view their own assignments
CREATE POLICY "Teachers can view their allowed classes"
    ON teacher_class_assignments
    FOR SELECT
    USING (
        teacher_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin' AND school_id = teacher_class_assignments.school_id
        )
    );

-- Admins can manage assignments within their school
CREATE POLICY "Admins manage teacher class assignments"
    ON teacher_class_assignments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin' AND school_id = teacher_class_assignments.school_id
        )
    );

COMMENT ON TABLE teacher_class_assignments IS 'Stores which specific classes a teacher is allowed to teach.';

