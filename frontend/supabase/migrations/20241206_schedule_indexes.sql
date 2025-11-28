-- =============================================
-- Migration: Schedule Index Optimizations
-- =============================================
-- Improves lookup speed for conflict detection and schedule queries.

-- Composite index for teacher time-slot conflicts (read-heavy path)
CREATE INDEX IF NOT EXISTS idx_class_schedules_teacher_slot
  ON class_schedules (school_id, teacher_id, day_of_week, period_id, academic_year)
  WHERE is_active;

-- Composite index for class schedule retrieval by school/year
CREATE INDEX IF NOT EXISTS idx_class_schedules_class_year
  ON class_schedules (school_id, class_id, academic_year)
  WHERE is_active;

-- Ensure fast lookups when asserting teacher-class permissions
CREATE INDEX IF NOT EXISTS idx_teacher_class_assignments_school_teacher_class
  ON teacher_class_assignments (school_id, teacher_id, class_id);

-- Speed up subject assignment checks (teacher + subject within school)
CREATE INDEX IF NOT EXISTS idx_teacher_subject_classes_school_teacher_subject
  ON teacher_subject_classes (school_id, teacher_id, subject_id);

