-- =============================================
-- TILMEEDHY - TEST DATA SETUP
-- Run this AFTER the main migration
-- Creates: School, Admin, Teacher, Parent, Students, Classes
-- =============================================

-- =============================================
-- STEP 1: Create School
-- =============================================
INSERT INTO schools (id, name, name_ar, contact_email, contact_phone, address, is_active, subscription_status)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Al-Noor International School',
    'مدرسة النور العالمية',
    'admin@alnoor.ly',
    '+218-91-234-5678',
    'Tripoli, Libya',
    true,
    'active'
);

-- =============================================
-- STEP 2: Create User Profiles (linked to Auth)
-- =============================================
-- Admin UUID: 752ef552-9bef-4c89-bf6a-ac6c781673c8
-- Teacher UUID: e96bb36d-ba00-43cf-969e-b3889476d2a1
-- Parent UUID: ba1c30c0-4f60-4e3d-9926-6c7e64d340c4

INSERT INTO users (id, name, role, email, phone, school_id, language_preference, is_active)
VALUES 
(
    '752ef552-9bef-4c89-bf6a-ac6c781673c8',
    'Ahmed Al-Mansouri',
    'admin',
    'admin@alnoor.ly',
    '+218-91-111-1111',
    '00000000-0000-0000-0000-000000000001',
    'ar',
    true
),
(
    'e96bb36d-ba00-43cf-969e-b3889476d2a1',
    'Fatima Hassan',
    'teacher',
    'teacher@alnoor.ly',
    '+218-91-222-2222',
    '00000000-0000-0000-0000-000000000001',
    'ar',
    true
),
(
    'ba1c30c0-4f60-4e3d-9926-6c7e64d340c4',
    'Mohammed Ibrahim',
    'parent',
    'parent@alnoor.ly',
    '+218-91-333-3333',
    '00000000-0000-0000-0000-000000000001',
    'ar',
    true
);

-- =============================================
-- STEP 3: Create Class
-- =============================================
INSERT INTO classes (id, name, grade_level, section, academic_year, school_id, main_teacher_id, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'Grade 5A',
    'Grade 5',
    'A',
    '2024-2025',
    '00000000-0000-0000-0000-000000000001',
    'e96bb36d-ba00-43cf-969e-b3889476d2a1',
    true
);

-- =============================================
-- STEP 4: Create Students
-- =============================================
INSERT INTO students (id, name, student_id_number, date_of_birth, gender, class_id, parent_id, school_id, is_active)
VALUES 
(
    '00000000-0000-0000-0000-000000000003',
    'Sara Mohammed',
    'STU001',
    '2014-03-15',
    'female',
    '00000000-0000-0000-0000-000000000002',
    'ba1c30c0-4f60-4e3d-9926-6c7e64d340c4',
    '00000000-0000-0000-0000-000000000001',
    true
),
(
    '00000000-0000-0000-0000-000000000004',
    'Ali Mohammed',
    'STU002',
    '2016-07-22',
    'male',
    '00000000-0000-0000-0000-000000000002',
    'ba1c30c0-4f60-4e3d-9926-6c7e64d340c4',
    '00000000-0000-0000-0000-000000000001',
    true
);

-- =============================================
-- STEP 5: Create Subject
-- =============================================
INSERT INTO subjects (id, name, name_ar, code, class_id, teacher_id, school_id, max_grade, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000005',
    'Mathematics',
    'الرياضيات',
    'MATH5',
    '00000000-0000-0000-0000-000000000002',
    'e96bb36d-ba00-43cf-969e-b3889476d2a1',
    '00000000-0000-0000-0000-000000000001',
    100.00,
    true
);

-- =============================================
-- STEP 6: Create Sample Homework
-- =============================================
INSERT INTO homework (id, title, description, subject_id, class_id, teacher_id, school_id, due_date, is_published)
VALUES (
    '00000000-0000-0000-0000-000000000006',
    'Algebra Practice - Chapter 3',
    'Complete exercises 1-20 from Chapter 3. Show all your work and write the steps clearly.',
    '00000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000002',
    'e96bb36d-ba00-43cf-969e-b3889476d2a1',
    '00000000-0000-0000-0000-000000000001',
    (CURRENT_DATE + INTERVAL '7 days'),
    true
);

-- =============================================
-- STEP 7: Create Sample Grades
-- =============================================
INSERT INTO grades (id, student_id, subject_id, teacher_id, school_id, grade, max_grade, exam_type, exam_name, feedback, date)
VALUES 
(
    '00000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000005',
    'e96bb36d-ba00-43cf-969e-b3889476d2a1',
    '00000000-0000-0000-0000-000000000001',
    85.00,
    100.00,
    'midterm',
    'Midterm Exam',
    'Excellent work on problem solving!',
    CURRENT_DATE - INTERVAL '5 days'
),
(
    '00000000-0000-0000-0000-000000000008',
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000005',
    'e96bb36d-ba00-43cf-969e-b3889476d2a1',
    '00000000-0000-0000-0000-000000000001',
    92.00,
    100.00,
    'midterm',
    'Midterm Exam',
    'Outstanding performance!',
    CURRENT_DATE - INTERVAL '5 days'
);

-- =============================================
-- STEP 8: Create Sample Attendance
-- =============================================
INSERT INTO attendance (id, student_id, class_id, school_id, date, status, note)
VALUES 
(
    '00000000-0000-0000-0000-000000000009',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    CURRENT_DATE,
    'present',
    NULL
),
(
    '00000000-0000-0000-0000-00000000000a',
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    CURRENT_DATE,
    'present',
    NULL
);

-- =============================================
-- STEP 9: Create Teacher Note
-- =============================================
INSERT INTO teacher_notes (id, student_id, teacher_id, subject_id, school_id, content, note_type)
VALUES (
    '00000000-0000-0000-0000-00000000000b',
    '00000000-0000-0000-0000-000000000003',
    'e96bb36d-ba00-43cf-969e-b3889476d2a1',
    '00000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000001',
    'Great Progress in Math: Sara has shown excellent improvement in algebraic problem solving this week. Keep encouraging her practice!',
    'positive'
);

-- =============================================
-- STEP 10: Create Announcement
-- =============================================
INSERT INTO announcements (id, school_id, author_id, title, content, target_audience, is_published, priority)
VALUES (
    '00000000-0000-0000-0000-00000000000c',
    '00000000-0000-0000-0000-000000000001',
    '752ef552-9bef-4c89-bf6a-ac6c781673c8',
    'Welcome to Al-Noor School!',
    'Dear parents, welcome to our new digital platform! You can now track your children''s progress, homework, and communicate with teachers all in one place.',
    'parents',
    true,
    'normal'
);

-- =============================================
-- VERIFICATION QUERIES
-- Run these to check your data
-- =============================================

-- Check school
SELECT * FROM schools;

-- Check users
SELECT id, name, role, email FROM users;

-- Check classes
SELECT * FROM classes;

-- Check students
SELECT * FROM students;

-- Check subjects
SELECT * FROM subjects;

-- =============================================
-- NEXT STEPS:
-- 1. Create users in Supabase Auth UI
-- 2. Copy their UUIDs
-- 3. Uncomment and update the INSERT statements above
-- 4. Run them one by one
-- =============================================

