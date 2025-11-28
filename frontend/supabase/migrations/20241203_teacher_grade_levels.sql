-- =============================================
-- Migration: Teacher Grade Level Permissions
-- =============================================

CREATE TABLE IF NOT EXISTS teacher_grade_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    grade_level TEXT NOT NULL,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(teacher_id, grade_level, school_id)
);

CREATE INDEX idx_teacher_grade_levels_teacher ON teacher_grade_levels(teacher_id);
CREATE INDEX idx_teacher_grade_levels_school ON teacher_grade_levels(school_id);
CREATE INDEX idx_teacher_grade_levels_grade ON teacher_grade_levels(grade_level);

ALTER TABLE teacher_grade_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view their own grade levels"
    ON teacher_grade_levels
    FOR SELECT
    USING (
        teacher_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
              AND role = 'admin'
              AND school_id = teacher_grade_levels.school_id
        )
    );

CREATE POLICY "Admins manage grade levels"
    ON teacher_grade_levels
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
              AND role = 'admin'
              AND school_id = teacher_grade_levels.school_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
              AND role = 'admin'
              AND school_id = teacher_grade_levels.school_id
        )
    );

COMMENT ON TABLE teacher_grade_levels IS 'Stores which grade levels (years) a teacher is allowed to teach.';

