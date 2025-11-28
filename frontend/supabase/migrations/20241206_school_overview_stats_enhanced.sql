-- =============================================
-- Migration: Enhanced School Overview Stats
-- =============================================
-- Adds active counts and parent counts to the materialized view

DROP MATERIALIZED VIEW IF EXISTS school_overview_stats CASCADE;

CREATE MATERIALIZED VIEW school_overview_stats
AS
SELECT
  s.id AS school_id,
  s.name,
  s.name_ar,
  -- Teacher counts
  (
    SELECT COUNT(*)
    FROM users u
    WHERE u.school_id = s.id
      AND u.role = 'teacher'
  ) AS teacher_count,
  (
    SELECT COUNT(*)
    FROM users u
    WHERE u.school_id = s.id
      AND u.role = 'teacher'
      AND u.is_active = true
  ) AS active_teacher_count,
  -- Student counts
  (
    SELECT COUNT(*)
    FROM students st
    WHERE st.school_id = s.id
  ) AS student_count,
  (
    SELECT COUNT(*)
    FROM students st
    WHERE st.school_id = s.id
      AND st.is_active = true
  ) AS active_student_count,
  -- Class counts
  (
    SELECT COUNT(*)
    FROM classes c
    WHERE c.school_id = s.id
  ) AS class_count,
  (
    SELECT COUNT(*)
    FROM classes c
    WHERE c.school_id = s.id
      AND c.is_active = true
  ) AS active_class_count,
  -- Subject counts (includes global subjects)
  (
    SELECT COUNT(*)
    FROM subjects sub
    WHERE sub.school_id = s.id OR sub.school_id IS NULL
  ) AS subject_count,
  (
    SELECT COUNT(*)
    FROM subjects sub
    WHERE (sub.school_id = s.id OR sub.school_id IS NULL)
      AND sub.is_active = true
  ) AS active_subject_count,
  -- Parent counts
  (
    SELECT COUNT(*)
    FROM users u
    WHERE u.school_id = s.id
      AND u.role = 'parent'
      AND u.is_active = true
  ) AS active_parent_count,
  NOW() AS refreshed_at
FROM schools s
WITH NO DATA;

CREATE UNIQUE INDEX idx_school_overview_stats_school
  ON school_overview_stats (school_id);

-- Recreate the refresh function
CREATE OR REPLACE FUNCTION refresh_school_overview_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY school_overview_stats;
  EXCEPTION
    WHEN object_not_in_prerequisite_state THEN
      REFRESH MATERIALIZED VIEW school_overview_stats;
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION refresh_school_overview_stats() TO service_role;
GRANT SELECT ON school_overview_stats TO authenticated, service_role;

-- Populate initial snapshot
REFRESH MATERIALIZED VIEW school_overview_stats;

-- Recreate the convenience view
CREATE OR REPLACE VIEW school_overview_stats_view AS
SELECT * FROM school_overview_stats;

