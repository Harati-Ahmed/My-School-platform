-- =============================================
-- Migration: RLS Performance Patch
-- =============================================
-- Reduce repeated evaluations of auth.* helpers by caching auth.uid()
-- within each policy and consolidating admin checks.

-- ---------- teacher_class_assignments ----------
DROP POLICY IF EXISTS "Teachers can view their allowed classes" ON teacher_class_assignments;
CREATE POLICY "Teachers can view their allowed classes"
  ON teacher_class_assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM (SELECT auth.uid() AS uid) auth_ctx
      LEFT JOIN users admin_users
        ON admin_users.id = auth_ctx.uid
      WHERE teacher_class_assignments.teacher_id = auth_ctx.uid
        OR (
          admin_users.role = 'admin'
          AND admin_users.school_id = teacher_class_assignments.school_id
        )
    )
  );

DROP POLICY IF EXISTS "Admins manage teacher class assignments" ON teacher_class_assignments;
CREATE POLICY "Admins manage teacher class assignments"
  ON teacher_class_assignments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM (SELECT auth.uid() AS uid) auth_ctx
      JOIN users admin_users
        ON admin_users.id = auth_ctx.uid
      WHERE admin_users.role = 'admin'
        AND admin_users.school_id = teacher_class_assignments.school_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM (SELECT auth.uid() AS uid) auth_ctx
      JOIN users admin_users
        ON admin_users.id = auth_ctx.uid
      WHERE admin_users.role = 'admin'
        AND admin_users.school_id = teacher_class_assignments.school_id
    )
  );

-- ---------- teacher_grade_levels ----------
DROP POLICY IF EXISTS "Teachers can view their own grade levels" ON teacher_grade_levels;
CREATE POLICY "Teachers can view their own grade levels"
  ON teacher_grade_levels
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM (SELECT auth.uid() AS uid) auth_ctx
      LEFT JOIN users admin_users
        ON admin_users.id = auth_ctx.uid
      WHERE teacher_grade_levels.teacher_id = auth_ctx.uid
        OR (
          admin_users.role = 'admin'
          AND admin_users.school_id = teacher_grade_levels.school_id
        )
    )
  );

DROP POLICY IF EXISTS "Admins manage grade levels" ON teacher_grade_levels;
CREATE POLICY "Admins manage grade levels"
  ON teacher_grade_levels
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM (SELECT auth.uid() AS uid) auth_ctx
      JOIN users admin_users
        ON admin_users.id = auth_ctx.uid
      WHERE admin_users.role = 'admin'
        AND admin_users.school_id = teacher_grade_levels.school_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM (SELECT auth.uid() AS uid) auth_ctx
      JOIN users admin_users
        ON admin_users.id = auth_ctx.uid
      WHERE admin_users.role = 'admin'
        AND admin_users.school_id = teacher_grade_levels.school_id
    )
  );

-- ---------- class_periods ----------
DROP POLICY IF EXISTS "Admins can manage periods in their school" ON class_periods;
CREATE POLICY "Admins can manage periods in their school"
  ON class_periods
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM (SELECT auth.uid() AS uid) auth_ctx
      JOIN users admin_users
        ON admin_users.id = auth_ctx.uid
      WHERE admin_users.role = 'admin'
        AND admin_users.school_id = class_periods.school_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM (SELECT auth.uid() AS uid) auth_ctx
      JOIN users admin_users
        ON admin_users.id = auth_ctx.uid
      WHERE admin_users.role = 'admin'
        AND admin_users.school_id = class_periods.school_id
    )
  );

DROP POLICY IF EXISTS "Teachers can view periods in their school" ON class_periods;
CREATE POLICY "Teachers can view periods in their school"
  ON class_periods
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM (SELECT auth.uid() AS uid) auth_ctx
      JOIN users school_users
        ON school_users.id = auth_ctx.uid
      WHERE school_users.school_id = class_periods.school_id
    )
  );

-- ---------- class_schedules ----------
DROP POLICY IF EXISTS "Admins can manage schedules in their school" ON class_schedules;
CREATE POLICY "Admins can manage schedules in their school"
  ON class_schedules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM (SELECT auth.uid() AS uid) auth_ctx
      JOIN users admin_users
        ON admin_users.id = auth_ctx.uid
      WHERE admin_users.role = 'admin'
        AND admin_users.school_id = class_schedules.school_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM (SELECT auth.uid() AS uid) auth_ctx
      JOIN users admin_users
        ON admin_users.id = auth_ctx.uid
      WHERE admin_users.role = 'admin'
        AND admin_users.school_id = class_schedules.school_id
    )
  );

DROP POLICY IF EXISTS "Teachers can view their own schedules" ON class_schedules;
CREATE POLICY "Teachers can view their own schedules"
  ON class_schedules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM (SELECT auth.uid() AS uid) auth_ctx
      LEFT JOIN users admin_users
        ON admin_users.id = auth_ctx.uid
      WHERE class_schedules.teacher_id = auth_ctx.uid
        OR (
          admin_users.role = 'admin'
          AND admin_users.school_id = class_schedules.school_id
        )
    )
  );

