-- =============================================
-- Database Functions and Triggers
-- Automated notifications, audit logging, and data integrity
-- =============================================

-- =============================================
-- NOTIFICATION CREATION FUNCTIONS
-- =============================================

-- Function to create notification for a user
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type notification_type,
  p_title VARCHAR,
  p_message TEXT,
  p_link TEXT DEFAULT NULL,
  p_related_id UUID DEFAULT NULL,
  p_school_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id, type, title, message, link, related_id, school_id
  ) VALUES (
    p_user_id, p_type, p_title, p_message, p_link, p_related_id, p_school_id
  ) RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify parent when homework is assigned
CREATE OR REPLACE FUNCTION notify_homework_assigned()
RETURNS TRIGGER AS $$
DECLARE
  parent_record RECORD;
BEGIN
  -- Only notify for published homework
  IF NEW.is_published THEN
    -- Notify all parents of students in the class
    FOR parent_record IN 
      SELECT DISTINCT s.parent_id, u.name as parent_name
      FROM students s
      JOIN users u ON u.id = s.parent_id
      WHERE s.class_id = NEW.class_id AND s.is_active = true
    LOOP
      PERFORM create_notification(
        parent_record.parent_id,
        'homework',
        'New Homework Assigned',
        'New homework "' || NEW.title || '" has been assigned.',
        '/homework/' || NEW.id,
        NEW.id,
        NEW.school_id
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for homework assignment notifications
CREATE TRIGGER trigger_notify_homework_assigned
  AFTER INSERT ON homework
  FOR EACH ROW
  EXECUTE FUNCTION notify_homework_assigned();

-- Function to notify parent when grade is posted
CREATE OR REPLACE FUNCTION notify_grade_posted()
RETURNS TRIGGER AS $$
DECLARE
  parent_id UUID;
  subject_name VARCHAR;
BEGIN
  -- Get parent ID
  SELECT s.parent_id INTO parent_id
  FROM students s
  WHERE s.id = NEW.student_id;
  
  -- Get subject name
  SELECT sub.name INTO subject_name
  FROM subjects sub
  WHERE sub.id = NEW.subject_id;
  
  -- Create notification
  IF parent_id IS NOT NULL THEN
    PERFORM create_notification(
      parent_id,
      'grade',
      'New Grade Posted',
      'A new ' || NEW.exam_type || ' grade has been posted for ' || subject_name || '.',
      '/grades',
      NEW.id,
      NEW.school_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for grade posting notifications
CREATE TRIGGER trigger_notify_grade_posted
  AFTER INSERT ON grades
  FOR EACH ROW
  EXECUTE FUNCTION notify_grade_posted();

-- Function to notify parent when attendance is marked absent
CREATE OR REPLACE FUNCTION notify_attendance_marked()
RETURNS TRIGGER AS $$
DECLARE
  parent_id UUID;
BEGIN
  -- Only notify for absences
  IF NEW.status = 'absent' THEN
    -- Get parent ID
    SELECT s.parent_id INTO parent_id
    FROM students s
    WHERE s.id = NEW.student_id;
    
    -- Create notification
    IF parent_id IS NOT NULL THEN
      PERFORM create_notification(
        parent_id,
        'attendance',
        'Attendance Alert',
        'Your child was marked absent on ' || NEW.date || '.',
        '/attendance',
        NEW.id,
        NEW.school_id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for attendance notifications
CREATE TRIGGER trigger_notify_attendance_marked
  AFTER INSERT ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION notify_attendance_marked();

-- Function to notify parent when teacher note is added
CREATE OR REPLACE FUNCTION notify_teacher_note_added()
RETURNS TRIGGER AS $$
DECLARE
  parent_id UUID;
  teacher_name VARCHAR;
BEGIN
  -- Get parent ID and teacher name
  SELECT s.parent_id, u.name INTO parent_id, teacher_name
  FROM students s
  CROSS JOIN users u
  WHERE s.id = NEW.student_id AND u.id = NEW.teacher_id;
  
  -- Create notification
  IF parent_id IS NOT NULL THEN
    PERFORM create_notification(
      parent_id,
      'note',
      'New Teacher Note',
      'Teacher ' || teacher_name || ' has added a note about your child.',
      '/notes',
      NEW.id,
      NEW.school_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for teacher note notifications
CREATE TRIGGER trigger_notify_teacher_note_added
  AFTER INSERT ON teacher_notes
  FOR EACH ROW
  EXECUTE FUNCTION notify_teacher_note_added();

-- Function to notify users when announcement is published
CREATE OR REPLACE FUNCTION notify_announcement_published()
RETURNS TRIGGER AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Only notify when announcement is newly published
  IF NEW.is_published = true AND (OLD.is_published = false OR OLD.is_published IS NULL) THEN
    -- Notify based on target audience
    IF NEW.target_audience = 'all' THEN
      -- Notify all users in the school
      FOR user_record IN 
        SELECT id FROM users WHERE school_id = NEW.school_id AND is_active = true
      LOOP
        PERFORM create_notification(
          user_record.id,
          'announcement',
          'New Announcement: ' || NEW.title,
          LEFT(NEW.content, 100) || CASE WHEN LENGTH(NEW.content) > 100 THEN '...' ELSE '' END,
          '/announcements/' || NEW.id,
          NEW.id,
          NEW.school_id
        );
      END LOOP;
    ELSIF NEW.target_audience = 'parents' THEN
      -- Notify only parents
      FOR user_record IN 
        SELECT id FROM users WHERE school_id = NEW.school_id AND role = 'parent' AND is_active = true
      LOOP
        PERFORM create_notification(
          user_record.id,
          'announcement',
          'New Announcement: ' || NEW.title,
          LEFT(NEW.content, 100) || CASE WHEN LENGTH(NEW.content) > 100 THEN '...' ELSE '' END,
          '/announcements/' || NEW.id,
          NEW.id,
          NEW.school_id
        );
      END LOOP;
    ELSIF NEW.target_audience = 'teachers' THEN
      -- Notify only teachers
      FOR user_record IN 
        SELECT id FROM users WHERE school_id = NEW.school_id AND role = 'teacher' AND is_active = true
      LOOP
        PERFORM create_notification(
          user_record.id,
          'announcement',
          'New Announcement: ' || NEW.title,
          LEFT(NEW.content, 100) || CASE WHEN LENGTH(NEW.content) > 100 THEN '...' ELSE '' END,
          '/announcements/' || NEW.id,
          NEW.id,
          NEW.school_id
        );
      END LOOP;
    ELSIF NEW.target_audience = 'class' AND NEW.target_class_id IS NOT NULL THEN
      -- Notify parents of students in specific class
      FOR user_record IN 
        SELECT DISTINCT s.parent_id as id
        FROM students s
        WHERE s.class_id = NEW.target_class_id AND s.is_active = true
      LOOP
        PERFORM create_notification(
          user_record.id,
          'announcement',
          'New Announcement: ' || NEW.title,
          LEFT(NEW.content, 100) || CASE WHEN LENGTH(NEW.content) > 100 THEN '...' ELSE '' END,
          '/announcements/' || NEW.id,
          NEW.id,
          NEW.school_id
        );
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for announcement notifications
CREATE TRIGGER trigger_notify_announcement_published
  AFTER INSERT OR UPDATE ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION notify_announcement_published();

-- =============================================
-- AUDIT LOGGING FUNCTIONS
-- =============================================

-- Function to create audit log entry
CREATE OR REPLACE FUNCTION create_audit_log(
  p_user_id UUID,
  p_action VARCHAR,
  p_entity_type VARCHAR,
  p_entity_id UUID,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_school_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO audit_logs (
    user_id, action, entity_type, entity_id, 
    old_values, new_values, school_id
  ) VALUES (
    p_user_id, p_action, p_entity_type, p_entity_id,
    p_old_values, p_new_values, p_school_id
  ) RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  v_school_id UUID;
BEGIN
  -- Get school_id if it exists in the table
  IF TG_OP = 'DELETE' THEN
    v_school_id := COALESCE(OLD.school_id, NULL);
    PERFORM create_audit_log(
      auth.uid(),
      'deleted_' || TG_TABLE_NAME,
      TG_TABLE_NAME,
      OLD.id,
      to_jsonb(OLD),
      NULL,
      v_school_id
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    v_school_id := COALESCE(NEW.school_id, NULL);
    PERFORM create_audit_log(
      auth.uid(),
      'updated_' || TG_TABLE_NAME,
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW),
      v_school_id
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    v_school_id := COALESCE(NEW.school_id, NULL);
    PERFORM create_audit_log(
      auth.uid(),
      'created_' || TG_TABLE_NAME,
      TG_TABLE_NAME,
      NEW.id,
      NULL,
      to_jsonb(NEW),
      v_school_id
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to important tables
CREATE TRIGGER audit_students AFTER INSERT OR UPDATE OR DELETE ON students
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_grades AFTER INSERT OR UPDATE OR DELETE ON grades
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =============================================
-- UTILITY FUNCTIONS
-- =============================================

-- Function to get student attendance statistics
CREATE OR REPLACE FUNCTION get_student_attendance_stats(
  p_student_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_days BIGINT,
  present_days BIGINT,
  absent_days BIGINT,
  late_days BIGINT,
  excused_days BIGINT,
  attendance_percentage DECIMAL
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
      (COUNT(*) FILTER (WHERE status = 'present')::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
      2
    ) as attendance_percentage
  FROM attendance
  WHERE student_id = p_student_id
    AND (p_start_date IS NULL OR date >= p_start_date)
    AND date <= p_end_date;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get student average grade
CREATE OR REPLACE FUNCTION get_student_average_grade(
  p_student_id UUID,
  p_subject_id UUID DEFAULT NULL
)
RETURNS DECIMAL AS $$
DECLARE
  avg_grade DECIMAL;
BEGIN
  SELECT ROUND(AVG(percentage), 2) INTO avg_grade
  FROM grades
  WHERE student_id = p_student_id
    AND (p_subject_id IS NULL OR subject_id = p_subject_id);
  
  RETURN COALESCE(avg_grade, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unread_count
  FROM notifications
  WHERE user_id = p_user_id AND is_read = false;
  
  RETURN unread_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to mark note as read and update read_at
CREATE OR REPLACE FUNCTION mark_note_as_read(
  p_note_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  parent_id UUID;
BEGIN
  -- Verify the user is the parent of the student
  SELECT s.parent_id INTO parent_id
  FROM teacher_notes tn
  JOIN students s ON s.id = tn.student_id
  WHERE tn.id = p_note_id;
  
  IF parent_id = p_user_id THEN
    UPDATE teacher_notes
    SET is_read = true, read_at = NOW()
    WHERE id = p_note_id;
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- CLEANUP FUNCTIONS
-- =============================================

-- Function to cleanup old audit logs (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(
  p_retention_days INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < (CURRENT_DATE - p_retention_days);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old notifications (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_notifications(
  p_retention_days INTEGER DEFAULT 30
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE is_read = true 
    AND created_at < (CURRENT_DATE - p_retention_days);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON FUNCTION create_notification IS 'Creates a new notification for a user';
COMMENT ON FUNCTION get_student_attendance_stats IS 'Returns attendance statistics for a student within a date range';
COMMENT ON FUNCTION get_student_average_grade IS 'Returns average grade percentage for a student, optionally filtered by subject';
COMMENT ON FUNCTION cleanup_old_audit_logs IS 'Deletes audit logs older than specified retention period';
COMMENT ON FUNCTION cleanup_old_notifications IS 'Deletes read notifications older than specified retention period';

