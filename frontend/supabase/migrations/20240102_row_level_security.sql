-- =============================================
-- Row Level Security (RLS) Policies
-- Ensures data isolation and access control
-- =============================================

-- Enable RLS on all tables
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- HELPER FUNCTIONS FOR RLS
-- =============================================
-- Note: Functions are created in public schema, not auth schema
-- because auth schema is protected in Supabase

-- Get current user's role
CREATE OR REPLACE FUNCTION public.auth_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role
  FROM users
  WHERE id = (SELECT auth.uid());
$$;

-- Get current user's school_id
CREATE OR REPLACE FUNCTION public.auth_user_school_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT school_id
  FROM users
  WHERE id = (SELECT auth.uid());
$$;

-- Check if user is admin
CREATE OR REPLACE FUNCTION public.auth_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM users
    WHERE id = (SELECT auth.uid())
      AND role = 'admin'
  );
$$;

-- Check if user is teacher
CREATE OR REPLACE FUNCTION public.auth_is_teacher()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM users
    WHERE id = (SELECT auth.uid())
      AND role = 'teacher'
  );
$$;

-- Check if user is parent
CREATE OR REPLACE FUNCTION public.auth_is_parent()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM users
    WHERE id = (SELECT auth.uid())
      AND role = 'parent'
  );
$$;

-- =============================================
-- SCHOOLS TABLE POLICIES
-- =============================================

-- Admins can view their own school
CREATE POLICY "Admins can view their school"
  ON schools FOR SELECT
  USING (public.auth_is_admin() AND id = public.auth_user_school_id());

-- Admins can update their own school
CREATE POLICY "Admins can update their school"
  ON schools FOR UPDATE
  USING (public.auth_is_admin() AND id = public.auth_user_school_id());

-- All authenticated users can view their school (read-only data)
CREATE POLICY "Users can view their school basic info"
  ON schools FOR SELECT
  USING (id = public.auth_user_school_id());

-- =============================================
-- USERS TABLE POLICIES
-- =============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- Admins can view all users in their school
CREATE POLICY "Admins can view all school users"
  ON users FOR SELECT
  USING (public.auth_is_admin() AND school_id = public.auth_user_school_id());

-- Admins can insert users in their school
CREATE POLICY "Admins can create users"
  ON users FOR INSERT
  WITH CHECK (public.auth_is_admin() AND school_id = public.auth_user_school_id());

-- Admins can update users in their school
CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  USING (public.auth_is_admin() AND school_id = public.auth_user_school_id());

-- Admins can delete users in their school
CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  USING (public.auth_is_admin() AND school_id = public.auth_user_school_id());

-- =============================================
-- CLASSES TABLE POLICIES
-- =============================================

-- All school users can view classes
CREATE POLICY "Users can view school classes"
  ON classes FOR SELECT
  USING (school_id = public.auth_user_school_id());

-- Admins can manage classes
CREATE POLICY "Admins can manage classes"
  ON classes FOR ALL
  USING (public.auth_is_admin() AND school_id = public.auth_user_school_id());

-- =============================================
-- STUDENTS TABLE POLICIES
-- =============================================

-- Parents can view their own children
CREATE POLICY "Parents can view their children"
  ON students FOR SELECT
  USING (public.auth_is_parent() AND parent_id = auth.uid());

-- Teachers can view students in their classes
CREATE POLICY "Teachers can view their students"
  ON students FOR SELECT
  USING (
    public.auth_is_teacher() AND 
    class_id IN (
      SELECT c.id FROM classes c 
      WHERE c.main_teacher_id = auth.uid() 
        OR c.id IN (
          SELECT s.class_id FROM subjects s WHERE s.teacher_id = auth.uid()
        )
    )
  );

-- Admins can manage all students in their school
CREATE POLICY "Admins can manage students"
  ON students FOR ALL
  USING (public.auth_is_admin() AND school_id = public.auth_user_school_id());

-- =============================================
-- SUBJECTS TABLE POLICIES
-- =============================================

-- All school users can view subjects
CREATE POLICY "Users can view subjects"
  ON subjects FOR SELECT
  USING (school_id = public.auth_user_school_id());

-- Teachers can view their subjects
CREATE POLICY "Teachers can view their subjects"
  ON subjects FOR SELECT
  USING (public.auth_is_teacher() AND teacher_id = auth.uid());

-- Admins can manage subjects
CREATE POLICY "Admins can manage subjects"
  ON subjects FOR ALL
  USING (public.auth_is_admin() AND school_id = public.auth_user_school_id());

-- =============================================
-- HOMEWORK TABLE POLICIES
-- =============================================

-- Parents can view homework for their children's classes
CREATE POLICY "Parents can view their children homework"
  ON homework FOR SELECT
  USING (
    public.auth_is_parent() AND 
    class_id IN (
      SELECT class_id FROM students WHERE parent_id = auth.uid()
    )
  );

-- Teachers can view homework they created
CREATE POLICY "Teachers can view their homework"
  ON homework FOR SELECT
  USING (public.auth_is_teacher() AND teacher_id = auth.uid());

-- Teachers can create homework for their classes
CREATE POLICY "Teachers can create homework"
  ON homework FOR INSERT
  WITH CHECK (
    public.auth_is_teacher() AND 
    teacher_id = auth.uid() AND
    class_id IN (
      SELECT c.id FROM classes c 
      WHERE c.main_teacher_id = auth.uid() 
        OR c.id IN (
          SELECT s.class_id FROM subjects s WHERE s.teacher_id = auth.uid()
        )
    )
  );

-- Teachers can update their homework
CREATE POLICY "Teachers can update their homework"
  ON homework FOR UPDATE
  USING (public.auth_is_teacher() AND teacher_id = auth.uid());

-- Teachers can delete their homework
CREATE POLICY "Teachers can delete their homework"
  ON homework FOR DELETE
  USING (public.auth_is_teacher() AND teacher_id = auth.uid());

-- Admins can manage all homework
CREATE POLICY "Admins can manage homework"
  ON homework FOR ALL
  USING (public.auth_is_admin() AND school_id = public.auth_user_school_id());

-- =============================================
-- GRADES TABLE POLICIES
-- =============================================

-- Parents can view their children's grades
CREATE POLICY "Parents can view their children grades"
  ON grades FOR SELECT
  USING (
    public.auth_is_parent() AND 
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

-- Teachers can view grades for their students
CREATE POLICY "Teachers can view grades"
  ON grades FOR SELECT
  USING (
    public.auth_is_teacher() AND 
    (teacher_id = auth.uid() OR
    student_id IN (
      SELECT s.id FROM students s
      WHERE s.class_id IN (
        SELECT c.id FROM classes c 
        WHERE c.main_teacher_id = auth.uid()
          OR c.id IN (
            SELECT sub.class_id FROM subjects sub WHERE sub.teacher_id = auth.uid()
          )
      )
    ))
  );

-- Teachers can insert grades
CREATE POLICY "Teachers can create grades"
  ON grades FOR INSERT
  WITH CHECK (public.auth_is_teacher() AND teacher_id = auth.uid());

-- Teachers can update their grades
CREATE POLICY "Teachers can update grades"
  ON grades FOR UPDATE
  USING (public.auth_is_teacher() AND teacher_id = auth.uid());

-- Teachers can delete their grades
CREATE POLICY "Teachers can delete grades"
  ON grades FOR DELETE
  USING (public.auth_is_teacher() AND teacher_id = auth.uid());

-- Admins can manage all grades
CREATE POLICY "Admins can manage grades"
  ON grades FOR ALL
  USING (public.auth_is_admin() AND school_id = public.auth_user_school_id());

-- =============================================
-- ATTENDANCE TABLE POLICIES
-- =============================================

-- Parents can view their children's attendance
CREATE POLICY "Parents can view their children attendance"
  ON attendance FOR SELECT
  USING (
    public.auth_is_parent() AND 
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

-- Teachers can view attendance for their classes
CREATE POLICY "Teachers can view attendance"
  ON attendance FOR SELECT
  USING (
    public.auth_is_teacher() AND 
    class_id IN (
      SELECT c.id FROM classes c 
      WHERE c.main_teacher_id = auth.uid()
        OR c.id IN (
          SELECT s.class_id FROM subjects s WHERE s.teacher_id = auth.uid()
        )
    )
  );

-- Teachers can mark attendance
CREATE POLICY "Teachers can mark attendance"
  ON attendance FOR INSERT
  WITH CHECK (public.auth_is_teacher() AND marked_by = auth.uid());

-- Teachers can update attendance
CREATE POLICY "Teachers can update attendance"
  ON attendance FOR UPDATE
  USING (public.auth_is_teacher() AND marked_by = auth.uid());

-- Admins can manage all attendance
CREATE POLICY "Admins can manage attendance"
  ON attendance FOR ALL
  USING (public.auth_is_admin() AND school_id = public.auth_user_school_id());

-- =============================================
-- TEACHER NOTES TABLE POLICIES
-- =============================================

-- Parents can view notes for their children
CREATE POLICY "Parents can view their children notes"
  ON teacher_notes FOR SELECT
  USING (
    public.auth_is_parent() AND 
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

-- Parents can mark notes as read
CREATE POLICY "Parents can mark notes as read"
  ON teacher_notes FOR UPDATE
  USING (
    public.auth_is_parent() AND 
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

-- Teachers can view their notes
CREATE POLICY "Teachers can view their notes"
  ON teacher_notes FOR SELECT
  USING (public.auth_is_teacher() AND teacher_id = auth.uid());

-- Teachers can create notes
CREATE POLICY "Teachers can create notes"
  ON teacher_notes FOR INSERT
  WITH CHECK (public.auth_is_teacher() AND teacher_id = auth.uid());

-- Teachers can update their notes
CREATE POLICY "Teachers can update their notes"
  ON teacher_notes FOR UPDATE
  USING (public.auth_is_teacher() AND teacher_id = auth.uid());

-- Teachers can delete their notes
CREATE POLICY "Teachers can delete their notes"
  ON teacher_notes FOR DELETE
  USING (public.auth_is_teacher() AND teacher_id = auth.uid());

-- Admins can manage all notes
CREATE POLICY "Admins can manage notes"
  ON teacher_notes FOR ALL
  USING (public.auth_is_admin() AND school_id = public.auth_user_school_id());

-- =============================================
-- ANNOUNCEMENTS TABLE POLICIES
-- =============================================

-- All school users can view published announcements
CREATE POLICY "Users can view published announcements"
  ON announcements FOR SELECT
  USING (
    is_published = true AND 
    school_id = public.auth_user_school_id() AND
    (
      target_audience = 'all' OR
      (target_audience = 'parents' AND public.auth_is_parent()) OR
      (target_audience = 'teachers' AND public.auth_is_teacher()) OR
      (target_audience = 'class' AND target_class_id IN (
        SELECT class_id FROM students WHERE parent_id = auth.uid()
      ))
    )
  );

-- Admins and teachers can create announcements
CREATE POLICY "Admins and teachers can create announcements"
  ON announcements FOR INSERT
  WITH CHECK (
    (public.auth_is_admin() OR public.auth_is_teacher()) AND 
    school_id = public.auth_user_school_id() AND
    author_id = auth.uid()
  );

-- Authors can update their announcements
CREATE POLICY "Authors can update announcements"
  ON announcements FOR UPDATE
  USING (author_id = auth.uid());

-- Authors can delete their announcements
CREATE POLICY "Authors can delete announcements"
  ON announcements FOR DELETE
  USING (author_id = auth.uid());

-- =============================================
-- NOTIFICATIONS TABLE POLICIES
-- =============================================

-- Users can view their own notifications
CREATE POLICY "Users can view their notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can mark notifications as read"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "Users can delete their notifications"
  ON notifications FOR DELETE
  USING (user_id = auth.uid());

-- System can insert notifications
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true); -- Will be restricted by application logic

-- =============================================
-- AUDIT LOGS TABLE POLICIES
-- =============================================

-- Admins can view audit logs for their school
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (public.auth_is_admin() AND school_id = public.auth_user_school_id());

-- System can insert audit logs
CREATE POLICY "System can create audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true); -- Will be restricted by application logic

-- =============================================
-- INDEXES FOR RLS OPTIMIZATION
-- =============================================

-- Additional indexes to optimize RLS policies
-- Note: Using IF NOT EXISTS to avoid errors if indexes already exist from previous migrations
CREATE INDEX IF NOT EXISTS idx_users_auth_uid ON users(id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_students_parent_class ON students(parent_id, class_id);
-- Note: idx_classes_teacher already exists in initial_schema.sql, but keeping IF NOT EXISTS for safety
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(main_teacher_id);
CREATE INDEX IF NOT EXISTS idx_subjects_teacher_class ON subjects(teacher_id, class_id);

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON POLICY "Parents can view their children" ON students IS 'Allows parents to only see their own children data';
COMMENT ON POLICY "Teachers can view their students" ON students IS 'Allows teachers to see students in classes they teach';
COMMENT ON POLICY "Admins can manage students" ON students IS 'School admins have full access to student data';

