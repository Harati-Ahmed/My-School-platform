-- =============================================
-- TILMEEDHY COMPLETE DATABASE SETUP
-- Run this entire file in Supabase SQL Editor
-- =============================================
-- This file combines all three migrations:
-- 1. Initial Schema (12 tables)
-- 2. Row Level Security Policies
-- 3. Functions and Triggers
-- =============================================

-- ============================================
-- MIGRATION 1: INITIAL SCHEMA
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create ENUMs
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'parent');
CREATE TYPE gender_type AS ENUM ('male', 'female');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
CREATE TYPE exam_type AS ENUM ('quiz', 'midterm', 'final', 'assignment', 'participation');
CREATE TYPE note_type AS ENUM ('positive', 'concern', 'general', 'behavioral');
CREATE TYPE priority_type AS ENUM ('urgent', 'normal', 'info');
CREATE TYPE audience_type AS ENUM ('all', 'parents', 'teachers', 'class');
CREATE TYPE subscription_status_type AS ENUM ('active', 'trial', 'expired', 'canceled');
CREATE TYPE notification_type AS ENUM ('homework', 'grade', 'attendance', 'note', 'announcement', 'system');

-- Create tables
CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    logo_url TEXT,
    theme_color VARCHAR(7) DEFAULT '#3B82F6',
    subscription_status subscription_status_type DEFAULT 'trial',
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    subscription_end DATE,
    max_students INTEGER DEFAULT 100,
    max_teachers INTEGER DEFAULT 10,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    address TEXT,
    timezone VARCHAR(50) DEFAULT 'Africa/Tripoli',
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    language_preference VARCHAR(2) DEFAULT 'ar' CHECK (language_preference IN ('ar', 'en')),
    theme_preference VARCHAR(10) DEFAULT 'light' CHECK (theme_preference IN ('light', 'dark', 'system')),
    is_active BOOLEAN DEFAULT true,
    profile_picture_url TEXT,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    grade_level VARCHAR(20) NOT NULL,
    section VARCHAR(10),
    academic_year VARCHAR(20) NOT NULL,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    main_teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
    max_capacity INTEGER DEFAULT 30,
    room_number VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, name, academic_year)
);

CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    student_id_number VARCHAR(50),
    date_of_birth DATE NOT NULL,
    gender gender_type NOT NULL,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    profile_picture_url TEXT,
    is_active BOOLEAN DEFAULT true,
    emergency_contact JSONB,
    medical_info TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, student_id_number)
);

CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    code VARCHAR(20),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    max_grade DECIMAL(5,2) DEFAULT 100.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, class_id, name)
);

CREATE TABLE homework (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    attachments JSONB DEFAULT '[]',
    is_published BOOLEAN DEFAULT true,
    completion_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    grade DECIMAL(5,2) NOT NULL,
    max_grade DECIMAL(5,2) NOT NULL,
    percentage DECIMAL(5,2) GENERATED ALWAYS AS ((grade / max_grade) * 100) STORED,
    exam_type exam_type NOT NULL,
    exam_name VARCHAR(255) NOT NULL,
    feedback TEXT,
    teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (grade >= 0 AND grade <= max_grade)
);

CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status attendance_status NOT NULL,
    marked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    note TEXT,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, date)
);

CREATE TABLE teacher_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    note_type note_type DEFAULT 'general',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    priority priority_type DEFAULT 'normal',
    target_audience audience_type DEFAULT 'all',
    target_class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    attachments JSONB DEFAULT '[]',
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    related_id UUID,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    sent_via JSONB DEFAULT '{"email": false, "sms": false, "push": false}',
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_schools_active ON schools(is_active);
CREATE INDEX idx_schools_subscription ON schools(subscription_status);
CREATE INDEX idx_users_school ON users(school_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_classes_school ON classes(school_id);
CREATE INDEX idx_classes_teacher ON classes(main_teacher_id);
CREATE INDEX idx_classes_active ON classes(is_active);
CREATE INDEX idx_students_school ON students(school_id);
CREATE INDEX idx_students_class ON students(class_id);
CREATE INDEX idx_students_parent ON students(parent_id);
CREATE INDEX idx_students_active ON students(is_active);
CREATE INDEX idx_subjects_school ON subjects(school_id);
CREATE INDEX idx_subjects_class ON subjects(class_id);
CREATE INDEX idx_subjects_teacher ON subjects(teacher_id);
CREATE INDEX idx_homework_school ON homework(school_id);
CREATE INDEX idx_homework_class ON homework(class_id);
CREATE INDEX idx_homework_subject ON homework(subject_id);
CREATE INDEX idx_homework_teacher ON homework(teacher_id);
CREATE INDEX idx_homework_due_date ON homework(due_date);
CREATE INDEX idx_homework_published ON homework(is_published);
CREATE INDEX idx_grades_student ON grades(student_id);
CREATE INDEX idx_grades_subject ON grades(subject_id);
CREATE INDEX idx_grades_school ON grades(school_id);
CREATE INDEX idx_grades_date ON grades(date);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_class ON attendance(class_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_school ON attendance(school_id);
CREATE INDEX idx_teacher_notes_student ON teacher_notes(student_id);
CREATE INDEX idx_teacher_notes_teacher ON teacher_notes(teacher_id);
CREATE INDEX idx_teacher_notes_school ON teacher_notes(school_id);
CREATE INDEX idx_teacher_notes_read ON teacher_notes(is_read);
CREATE INDEX idx_announcements_school ON announcements(school_id);
CREATE INDEX idx_announcements_author ON announcements(author_id);
CREATE INDEX idx_announcements_published ON announcements(is_published);
CREATE INDEX idx_announcements_audience ON announcements(target_audience);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_school ON notifications(school_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_user_read_created ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_school ON audit_logs(school_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_homework_updated_at BEFORE UPDATE ON homework FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON grades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teacher_notes_updated_at BEFORE UPDATE ON teacher_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- MIGRATION 2: ROW LEVEL SECURITY
-- ============================================

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

-- Helper functions for RLS
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth.user_school_id()
RETURNS UUID AS $$
  SELECT school_id FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth.is_teacher()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'teacher'
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth.is_parent()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'parent'
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Schools policies
CREATE POLICY "Admins can view their school"
  ON schools FOR SELECT
  USING (auth.is_admin() AND id = auth.user_school_id());

CREATE POLICY "Admins can update their school"
  ON schools FOR UPDATE
  USING (auth.is_admin() AND id = auth.user_school_id());

CREATE POLICY "Users can view their school basic info"
  ON schools FOR SELECT
  USING (id = auth.user_school_id());

-- Users policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Admins can view all school users"
  ON users FOR SELECT
  USING (auth.is_admin() AND school_id = auth.user_school_id());

CREATE POLICY "Admins can create users"
  ON users FOR INSERT
  WITH CHECK (auth.is_admin() AND school_id = auth.user_school_id());

CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  USING (auth.is_admin() AND school_id = auth.user_school_id());

CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  USING (auth.is_admin() AND school_id = auth.user_school_id());

-- Classes policies
CREATE POLICY "Users can view school classes"
  ON classes FOR SELECT
  USING (school_id = auth.user_school_id());

CREATE POLICY "Admins can manage classes"
  ON classes FOR ALL
  USING (auth.is_admin() AND school_id = auth.user_school_id());

-- Students policies
CREATE POLICY "Parents can view their children"
  ON students FOR SELECT
  USING (auth.is_parent() AND parent_id = auth.uid());

CREATE POLICY "Teachers can view their students"
  ON students FOR SELECT
  USING (
    auth.is_teacher() AND 
    class_id IN (
      SELECT c.id FROM classes c 
      WHERE c.main_teacher_id = auth.uid() 
        OR c.id IN (
          SELECT s.class_id FROM subjects s WHERE s.teacher_id = auth.uid()
        )
    )
  );

CREATE POLICY "Admins can manage students"
  ON students FOR ALL
  USING (auth.is_admin() AND school_id = auth.user_school_id());

-- Subjects policies
CREATE POLICY "Users can view subjects"
  ON subjects FOR SELECT
  USING (school_id = auth.user_school_id());

CREATE POLICY "Teachers can view their subjects"
  ON subjects FOR SELECT
  USING (auth.is_teacher() AND teacher_id = auth.uid());

CREATE POLICY "Admins can manage subjects"
  ON subjects FOR ALL
  USING (auth.is_admin() AND school_id = auth.user_school_id());

-- Homework policies
CREATE POLICY "Parents can view their children homework"
  ON homework FOR SELECT
  USING (
    auth.is_parent() AND 
    class_id IN (
      SELECT class_id FROM students WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can view their homework"
  ON homework FOR SELECT
  USING (auth.is_teacher() AND teacher_id = auth.uid());

CREATE POLICY "Teachers can create homework"
  ON homework FOR INSERT
  WITH CHECK (
    auth.is_teacher() AND 
    teacher_id = auth.uid() AND
    class_id IN (
      SELECT c.id FROM classes c 
      WHERE c.main_teacher_id = auth.uid() 
        OR c.id IN (
          SELECT s.class_id FROM subjects s WHERE s.teacher_id = auth.uid()
        )
    )
  );

CREATE POLICY "Teachers can update their homework"
  ON homework FOR UPDATE
  USING (auth.is_teacher() AND teacher_id = auth.uid());

CREATE POLICY "Teachers can delete their homework"
  ON homework FOR DELETE
  USING (auth.is_teacher() AND teacher_id = auth.uid());

CREATE POLICY "Admins can manage homework"
  ON homework FOR ALL
  USING (auth.is_admin() AND school_id = auth.user_school_id());

-- Grades policies
CREATE POLICY "Parents can view their children grades"
  ON grades FOR SELECT
  USING (
    auth.is_parent() AND 
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can view grades"
  ON grades FOR SELECT
  USING (
    auth.is_teacher() AND 
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

CREATE POLICY "Teachers can create grades"
  ON grades FOR INSERT
  WITH CHECK (auth.is_teacher() AND teacher_id = auth.uid());

CREATE POLICY "Teachers can update grades"
  ON grades FOR UPDATE
  USING (auth.is_teacher() AND teacher_id = auth.uid());

CREATE POLICY "Teachers can delete grades"
  ON grades FOR DELETE
  USING (auth.is_teacher() AND teacher_id = auth.uid());

CREATE POLICY "Admins can manage grades"
  ON grades FOR ALL
  USING (auth.is_admin() AND school_id = auth.user_school_id());

-- Attendance policies
CREATE POLICY "Parents can view their children attendance"
  ON attendance FOR SELECT
  USING (
    auth.is_parent() AND 
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can view attendance"
  ON attendance FOR SELECT
  USING (
    auth.is_teacher() AND 
    class_id IN (
      SELECT c.id FROM classes c 
      WHERE c.main_teacher_id = auth.uid()
        OR c.id IN (
          SELECT s.class_id FROM subjects s WHERE s.teacher_id = auth.uid()
        )
    )
  );

CREATE POLICY "Teachers can mark attendance"
  ON attendance FOR INSERT
  WITH CHECK (auth.is_teacher() AND marked_by = auth.uid());

CREATE POLICY "Teachers can update attendance"
  ON attendance FOR UPDATE
  USING (auth.is_teacher() AND marked_by = auth.uid());

CREATE POLICY "Admins can manage attendance"
  ON attendance FOR ALL
  USING (auth.is_admin() AND school_id = auth.user_school_id());

-- Teacher notes policies
CREATE POLICY "Parents can view their children notes"
  ON teacher_notes FOR SELECT
  USING (
    auth.is_parent() AND 
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can mark notes as read"
  ON teacher_notes FOR UPDATE
  USING (
    auth.is_parent() AND 
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can view their notes"
  ON teacher_notes FOR SELECT
  USING (auth.is_teacher() AND teacher_id = auth.uid());

CREATE POLICY "Teachers can create notes"
  ON teacher_notes FOR INSERT
  WITH CHECK (auth.is_teacher() AND teacher_id = auth.uid());

CREATE POLICY "Teachers can update their notes"
  ON teacher_notes FOR UPDATE
  USING (auth.is_teacher() AND teacher_id = auth.uid());

CREATE POLICY "Teachers can delete their notes"
  ON teacher_notes FOR DELETE
  USING (auth.is_teacher() AND teacher_id = auth.uid());

CREATE POLICY "Admins can manage notes"
  ON teacher_notes FOR ALL
  USING (auth.is_admin() AND school_id = auth.user_school_id());

-- Announcements policies
CREATE POLICY "Users can view published announcements"
  ON announcements FOR SELECT
  USING (
    is_published = true AND 
    school_id = auth.user_school_id() AND
    (
      target_audience = 'all' OR
      (target_audience = 'parents' AND auth.is_parent()) OR
      (target_audience = 'teachers' AND auth.is_teacher()) OR
      (target_audience = 'class' AND target_class_id IN (
        SELECT class_id FROM students WHERE parent_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Admins and teachers can create announcements"
  ON announcements FOR INSERT
  WITH CHECK (
    (auth.is_admin() OR auth.is_teacher()) AND 
    school_id = auth.user_school_id() AND
    author_id = auth.uid()
  );

CREATE POLICY "Authors can update announcements"
  ON announcements FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Authors can delete announcements"
  ON announcements FOR DELETE
  USING (author_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view their notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can mark notifications as read"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their notifications"
  ON notifications FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Audit logs policies
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (auth.is_admin() AND school_id = auth.user_school_id());

CREATE POLICY "System can create audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- Additional indexes for RLS optimization
CREATE INDEX idx_users_auth_uid ON users(id) WHERE is_active = true;
CREATE INDEX idx_students_parent_class ON students(parent_id, class_id);
CREATE INDEX idx_classes_teacher ON classes(main_teacher_id);
CREATE INDEX idx_subjects_teacher_class ON subjects(teacher_id, class_id);

-- ============================================
-- MIGRATION 3: FUNCTIONS AND TRIGGERS
-- ============================================

-- Notification creation function
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

-- Homework notification trigger
CREATE OR REPLACE FUNCTION notify_homework_assigned()
RETURNS TRIGGER AS $$
DECLARE
  parent_record RECORD;
BEGIN
  IF NEW.is_published THEN
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

CREATE TRIGGER trigger_notify_homework_assigned
  AFTER INSERT ON homework
  FOR EACH ROW
  EXECUTE FUNCTION notify_homework_assigned();

-- Grade notification trigger
CREATE OR REPLACE FUNCTION notify_grade_posted()
RETURNS TRIGGER AS $$
DECLARE
  parent_id UUID;
  subject_name VARCHAR;
BEGIN
  SELECT s.parent_id INTO parent_id
  FROM students s
  WHERE s.id = NEW.student_id;
  
  SELECT sub.name INTO subject_name
  FROM subjects sub
  WHERE sub.id = NEW.subject_id;
  
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

CREATE TRIGGER trigger_notify_grade_posted
  AFTER INSERT ON grades
  FOR EACH ROW
  EXECUTE FUNCTION notify_grade_posted();

-- Attendance notification trigger
CREATE OR REPLACE FUNCTION notify_attendance_marked()
RETURNS TRIGGER AS $$
DECLARE
  parent_id UUID;
BEGIN
  IF NEW.status = 'absent' THEN
    SELECT s.parent_id INTO parent_id
    FROM students s
    WHERE s.id = NEW.student_id;
    
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

CREATE TRIGGER trigger_notify_attendance_marked
  AFTER INSERT ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION notify_attendance_marked();

-- Teacher note notification trigger
CREATE OR REPLACE FUNCTION notify_teacher_note_added()
RETURNS TRIGGER AS $$
DECLARE
  parent_id UUID;
  teacher_name VARCHAR;
BEGIN
  SELECT s.parent_id, u.name INTO parent_id, teacher_name
  FROM students s
  CROSS JOIN users u
  WHERE s.id = NEW.student_id AND u.id = NEW.teacher_id;
  
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

CREATE TRIGGER trigger_notify_teacher_note_added
  AFTER INSERT ON teacher_notes
  FOR EACH ROW
  EXECUTE FUNCTION notify_teacher_note_added();

-- Announcement notification trigger
CREATE OR REPLACE FUNCTION notify_announcement_published()
RETURNS TRIGGER AS $$
DECLARE
  user_record RECORD;
BEGIN
  IF NEW.is_published = true AND (OLD.is_published = false OR OLD.is_published IS NULL) THEN
    IF NEW.target_audience = 'all' THEN
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

CREATE TRIGGER trigger_notify_announcement_published
  AFTER INSERT OR UPDATE ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION notify_announcement_published();

-- Audit logging function
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

-- Apply audit triggers
CREATE TRIGGER audit_students AFTER INSERT OR UPDATE OR DELETE ON students
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_grades AFTER INSERT OR UPDATE OR DELETE ON grades
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Utility functions
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

-- =============================================
-- MIGRATION COMPLETE!
-- =============================================
-- Your Tilmeedhy database is now ready to use!
-- Next steps:
-- 1. Create a school in the schools table
-- 2. Create test users in Authentication
-- 3. Link users to the school in the users table
-- =============================================

