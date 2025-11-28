-- =============================================
-- TILMEEDHY - TRIGGERS & COMPLETE RLS POLICIES
-- Run this AFTER the main migration
-- =============================================

-- =============================================
-- NOTIFICATION TRIGGER FUNCTIONS
-- =============================================

-- Create notification for new homework
CREATE OR REPLACE FUNCTION create_homework_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notifications if homework is published
  IF NEW.is_published = true THEN
    INSERT INTO notifications (user_id, type, title, message, link, related_id, school_id)
    SELECT 
      s.parent_id,
      'homework',
      'New Homework Assignment',
      'New homework in ' || sub.name || ': ' || NEW.title,
      '/homework/' || NEW.id,
      NEW.id,
      NEW.school_id
    FROM students s
    JOIN subjects sub ON sub.id = NEW.subject_id
    WHERE s.class_id = NEW.class_id 
      AND s.is_active = true 
      AND s.parent_id IS NOT NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_homework_created
  AFTER INSERT ON homework
  FOR EACH ROW
  EXECUTE FUNCTION create_homework_notifications();

-- Create notification for new grades
CREATE OR REPLACE FUNCTION create_grade_notifications()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link, related_id, school_id)
  SELECT 
    s.parent_id,
    'grade',
    'New Grade Posted',
    'New grade for ' || s.name || ' in ' || sub.name || ': ' || NEW.grade || '/' || NEW.max_grade,
    '/grades/' || NEW.id,
    NEW.id,
    NEW.school_id
  FROM students s
  JOIN subjects sub ON sub.id = NEW.subject_id
  WHERE s.id = NEW.student_id AND s.parent_id IS NOT NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_grade_created
  AFTER INSERT ON grades
  FOR EACH ROW
  EXECUTE FUNCTION create_grade_notifications();

-- Create notification for attendance
CREATE OR REPLACE FUNCTION create_attendance_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify for absent, late, or excused
  IF NEW.status IN ('absent', 'late', 'excused') THEN
    INSERT INTO notifications (user_id, type, title, message, link, related_id, school_id)
    SELECT 
      s.parent_id,
      'attendance',
      'Attendance Update',
      s.name || ' was marked as ' || NEW.status || ' on ' || NEW.date,
      '/attendance/' || NEW.id,
      NEW.id,
      NEW.school_id
    FROM students s
    WHERE s.id = NEW.student_id AND s.parent_id IS NOT NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_attendance_created
  AFTER INSERT ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION create_attendance_notifications();

-- Create notification for teacher notes
CREATE OR REPLACE FUNCTION create_note_notifications()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link, related_id, school_id)
  SELECT 
    s.parent_id,
    'note',
    'New Teacher Note',
    'New note about ' || s.name || ' from teacher',
    '/notes/' || NEW.id,
    NEW.id,
    NEW.school_id
  FROM students s
  WHERE s.id = NEW.student_id AND s.parent_id IS NOT NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_note_created
  AFTER INSERT ON teacher_notes
  FOR EACH ROW
  EXECUTE FUNCTION create_note_notifications();

-- Create notification for announcements
CREATE OR REPLACE FUNCTION create_announcement_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify when published
  IF NEW.is_published = true AND OLD.is_published = false THEN
    -- Notify based on audience
    IF NEW.target_audience = 'all' THEN
      -- Notify all parents
      INSERT INTO notifications (user_id, type, title, message, link, related_id, school_id)
      SELECT 
        u.id,
        'announcement',
        NEW.title,
        LEFT(NEW.content, 200),
        '/announcements/' || NEW.id,
        NEW.id,
        NEW.school_id
      FROM users u
      WHERE u.school_id = NEW.school_id 
        AND u.role = 'parent' 
        AND u.is_active = true;
        
    ELSIF NEW.target_audience = 'parents' THEN
      -- Notify only parents
      INSERT INTO notifications (user_id, type, title, message, link, related_id, school_id)
      SELECT 
        u.id,
        'announcement',
        NEW.title,
        LEFT(NEW.content, 200),
        '/announcements/' || NEW.id,
        NEW.id,
        NEW.school_id
      FROM users u
      WHERE u.school_id = NEW.school_id 
        AND u.role = 'parent' 
        AND u.is_active = true;
        
    ELSIF NEW.target_audience = 'class' AND NEW.target_class_id IS NOT NULL THEN
      -- Notify parents of students in specific class
      INSERT INTO notifications (user_id, type, title, message, link, related_id, school_id)
      SELECT 
        s.parent_id,
        'announcement',
        NEW.title,
        LEFT(NEW.content, 200),
        '/announcements/' || NEW.id,
        NEW.id,
        NEW.school_id
      FROM students s
      WHERE s.class_id = NEW.target_class_id 
        AND s.parent_id IS NOT NULL
        AND s.is_active = true;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_announcement_published
  AFTER UPDATE ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION create_announcement_notifications();

-- =============================================
-- UTILITY FUNCTIONS
-- =============================================

-- Get attendance statistics for a student
CREATE OR REPLACE FUNCTION get_student_attendance_stats(student_uuid UUID)
RETURNS TABLE (
  total_days BIGINT,
  present_days BIGINT,
  absent_days BIGINT,
  late_days BIGINT,
  excused_days BIGINT,
  attendance_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_days,
    COUNT(*) FILTER (WHERE status = 'present') as present_days,
    COUNT(*) FILTER (WHERE status = 'absent') as absent_days,
    COUNT(*) FILTER (WHERE status = 'late') as late_days,
    COUNT(*) FILTER (WHERE status = 'excused') as excused_days,
    ROUND(
      (COUNT(*) FILTER (WHERE status = 'present')::NUMERIC / 
       NULLIF(COUNT(*), 0)::NUMERIC * 100), 
      2
    ) as attendance_rate
  FROM attendance
  WHERE student_id = student_uuid;
END;
$$ LANGUAGE plpgsql;

-- Get average grade for a student
CREATE OR REPLACE FUNCTION get_student_average_grade(student_uuid UUID)
RETURNS NUMERIC AS $$
  SELECT COALESCE(ROUND(AVG(percentage), 2), 0)
  FROM grades
  WHERE student_id = student_uuid;
$$ LANGUAGE SQL STABLE;

-- =============================================
-- COMPLETE RLS POLICIES
-- =============================================

-- SCHOOLS POLICIES
CREATE POLICY "Admins can view their school"
  ON schools FOR SELECT
  USING (public.is_admin() AND id = public.user_school_id());

CREATE POLICY "Admins can update their school"
  ON schools FOR UPDATE
  USING (public.is_admin() AND id = public.user_school_id());

-- USERS POLICIES
CREATE POLICY "Admins can manage users in their school"
  ON users FOR ALL
  USING (public.is_admin() AND school_id = public.user_school_id());

CREATE POLICY "Teachers can view users in their school"
  ON users FOR SELECT
  USING (public.is_teacher() AND school_id = public.user_school_id());

-- CLASSES POLICIES
CREATE POLICY "Teachers can view classes"
  ON classes FOR SELECT
  USING (public.is_teacher() AND school_id = public.user_school_id());

CREATE POLICY "Admins can manage classes"
  ON classes FOR ALL
  USING (public.is_admin() AND school_id = public.user_school_id());

CREATE POLICY "Parents can view their children's classes"
  ON classes FOR SELECT
  USING (
    public.is_parent() AND 
    id IN (
      SELECT class_id FROM students WHERE parent_id = auth.uid()
    )
  );

-- STUDENTS POLICIES
CREATE POLICY "Teachers can view students"
  ON students FOR SELECT
  USING (public.is_teacher() AND school_id = public.user_school_id());

CREATE POLICY "Teachers can update students"
  ON students FOR UPDATE
  USING (public.is_teacher() AND school_id = public.user_school_id());

CREATE POLICY "Parents can update their children"
  ON students FOR UPDATE
  USING (public.is_parent() AND parent_id = auth.uid());

-- SUBJECTS POLICIES  
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view subjects"
  ON subjects FOR SELECT
  USING (public.is_teacher() AND school_id = public.user_school_id());

CREATE POLICY "Teachers can manage their subjects"
  ON subjects FOR ALL
  USING (public.is_teacher() AND teacher_id = auth.uid());

CREATE POLICY "Admins can manage subjects"
  ON subjects FOR ALL
  USING (public.is_admin() AND school_id = public.user_school_id());

CREATE POLICY "Parents can view their children's subjects"
  ON subjects FOR SELECT
  USING (
    public.is_parent() AND 
    class_id IN (
      SELECT class_id FROM students WHERE parent_id = auth.uid()
    )
  );

-- HOMEWORK POLICIES
ALTER TABLE homework ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage their homework"
  ON homework FOR ALL
  USING (public.is_teacher() AND teacher_id = auth.uid());

CREATE POLICY "Parents can view their children's homework"
  ON homework FOR SELECT
  USING (
    public.is_parent() AND 
    class_id IN (
      SELECT class_id FROM students WHERE parent_id = auth.uid()
    )
  );

-- GRADES POLICIES
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage grades"
  ON grades FOR ALL
  USING (
    public.is_teacher() AND 
    school_id = public.user_school_id() AND
    (teacher_id = auth.uid() OR teacher_id IS NULL)
  );

-- ATTENDANCE POLICIES
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage attendance"
  ON attendance FOR ALL
  USING (public.is_teacher() AND school_id = public.user_school_id());

CREATE POLICY "Parents can view their children's attendance"
  ON attendance FOR SELECT
  USING (
    public.is_parent() AND 
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

-- TEACHER NOTES POLICIES
ALTER TABLE teacher_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage their notes"
  ON teacher_notes FOR ALL
  USING (public.is_teacher() AND teacher_id = auth.uid());

CREATE POLICY "Parents can view notes about their children"
  ON teacher_notes FOR SELECT
  USING (
    public.is_parent() AND 
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can mark notes as read"
  ON teacher_notes FOR UPDATE
  USING (
    public.is_parent() AND 
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_parent() AND 
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

-- ANNOUNCEMENTS POLICIES
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage announcements"
  ON announcements FOR ALL
  USING (public.is_admin() AND school_id = public.user_school_id());

CREATE POLICY "Teachers can manage announcements"
  ON announcements FOR ALL
  USING (public.is_teacher() AND author_id = auth.uid());

CREATE POLICY "Parents can view published announcements"
  ON announcements FOR SELECT
  USING (
    public.is_parent() AND 
    school_id = public.user_school_id() AND
    is_published = true AND
    (
      target_audience IN ('all', 'parents') OR
      (target_audience = 'class' AND target_class_id IN (
        SELECT class_id FROM students WHERE parent_id = auth.uid()
      ))
    )
  );

-- NOTIFICATIONS POLICIES
CREATE POLICY "Users can update their notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their notifications"
  ON notifications FOR DELETE
  USING (user_id = auth.uid());

-- AUDIT LOGS POLICIES
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (public.is_admin() AND school_id = public.user_school_id());

-- =============================================
-- SUCCESS!
-- =============================================
-- All triggers and RLS policies are now in place!
-- Next: Create test users and data
-- =============================================

