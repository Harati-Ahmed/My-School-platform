-- =============================================
-- AUDIT LOGS PERFORMANCE INDEXES
-- =============================================
-- These indexes optimize the dashboard audit logs query
-- which filters by school_id and orders by created_at DESC

-- Composite index for dashboard query: WHERE school_id = ? ORDER BY created_at DESC LIMIT 5
CREATE INDEX IF NOT EXISTS idx_audit_logs_school_created_at_desc
  ON audit_logs(school_id, created_at DESC);

-- Index on school_id for general filtering (already may exist but ensure it does)
CREATE INDEX IF NOT EXISTS idx_audit_logs_school
  ON audit_logs(school_id);

-- Index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_desc
  ON audit_logs(created_at DESC);

-- Composite index for user_id + school_id queries (used in JOINs)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_school
  ON audit_logs(user_id, school_id);

-- Comments
COMMENT ON INDEX idx_audit_logs_school_created_at_desc IS 'Optimizes dashboard recent activity query';
COMMENT ON INDEX idx_audit_logs_school IS 'Optimizes school-scoped audit log queries';
COMMENT ON INDEX idx_audit_logs_created_at_desc IS 'Optimizes time-based audit log queries';
COMMENT ON INDEX idx_audit_logs_user_school IS 'Optimizes user + school filtered audit log queries';

