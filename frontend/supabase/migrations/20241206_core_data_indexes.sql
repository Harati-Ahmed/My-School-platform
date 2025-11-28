-- =============================================
-- Migration: Core Data Access Indexes
-- =============================================
-- Targets slow PostgREST queries on students, attendance, and grades.

-- Students: filter by school and creation/enrollment date.
CREATE INDEX IF NOT EXISTS idx_students_school_created_at
  ON students (school_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_students_school_enrollment_date
  ON students (school_id, enrollment_date DESC);

-- Attendance: frequent filters by school/date and school/student/date.
CREATE INDEX IF NOT EXISTS idx_attendance_school_date
  ON attendance (school_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_school_student_date
  ON attendance (school_id, student_id, date DESC);

-- Grades: filters by school/student/date and school/subject/date for analytics.
CREATE INDEX IF NOT EXISTS idx_grades_school_student_date
  ON grades (school_id, student_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_grades_school_subject_date
  ON grades (school_id, subject_id, date DESC);

