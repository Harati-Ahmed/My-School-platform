-- =============================================
-- Migration: School Overview Materialized View
-- =============================================
-- Provides fast aggregate counts per school to replace expensive ad-hoc queries.

CREATE MATERIALIZED VIEW IF NOT EXISTS school_overview_stats
AS
SELECT
  s.id AS school_id,
  s.name,
  s.name_ar,
  (
    SELECT COUNT(*)
    FROM users u
    WHERE u.school_id = s.id
      AND u.role = 'teacher'
  ) AS teacher_count,
  (
    SELECT COUNT(*)
    FROM students st
    WHERE st.school_id = s.id
  ) AS student_count,
  (
    SELECT COUNT(*)
    FROM classes c
    WHERE c.school_id = s.id
  ) AS class_count,
  (
    SELECT COUNT(*)
    FROM subjects sub
    WHERE sub.school_id = s.id
  ) AS subject_count,
  NOW() AS refreshed_at
FROM schools s
WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_school_overview_stats_school
  ON school_overview_stats (school_id);

-- Helper function to refresh the materialized view.
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

-- Populate initial snapshot.
REFRESH MATERIALIZED VIEW school_overview_stats;

-- Convenience view for simple selects (works even if MV refresh is in progress).
CREATE OR REPLACE VIEW school_overview_stats_view AS
SELECT * FROM school_overview_stats;


