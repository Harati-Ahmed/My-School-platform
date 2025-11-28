-- =============================================
-- Cleanup All Data Script
-- =============================================
-- This script deletes all data from all tables
-- Run this before seeding with the new schema

-- Delete in order to respect foreign key constraints

-- Delete dependent data first
DELETE FROM teacher_notes;
DELETE FROM grades;
DELETE FROM homework;
DELETE FROM attendance;
DELETE FROM announcements;

-- Delete students
DELETE FROM students;

-- Delete classes
DELETE FROM classes;

-- Delete subjects
DELETE FROM subjects;

-- Delete users (teachers, parents, admins)
DELETE FROM users WHERE role IN ('teacher', 'parent', 'admin');

-- Delete schools
DELETE FROM schools;

-- Verify cleanup
SELECT 
    'schools' as table_name, COUNT(*) as count FROM schools
UNION ALL
SELECT 'users', COUNT(*) FROM users WHERE role IN ('teacher', 'parent', 'admin')
UNION ALL
SELECT 'subjects', COUNT(*) FROM subjects
UNION ALL
SELECT 'classes', COUNT(*) FROM classes
UNION ALL
SELECT 'students', COUNT(*) FROM students
UNION ALL
SELECT 'grades', COUNT(*) FROM grades
UNION ALL
SELECT 'homework', COUNT(*) FROM homework
UNION ALL
SELECT 'attendance', COUNT(*) FROM attendance
UNION ALL
SELECT 'teacher_notes', COUNT(*) FROM teacher_notes
UNION ALL
SELECT 'announcements', COUNT(*) FROM announcements;

