/**
 * Comprehensive verification of all data relationships
 * 
 * Usage:
 *   node verify-all-relationships.js [PASSWORD]
 * 
 * Or set environment variables:
 *   DATABASE_PASSWORD=your-password
 *   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local if it exists
function loadEnvFile() {
  const envPath = path.join(__dirname, '../../.env.local');
  if (!fs.existsSync(envPath)) {
    return {};
  }
  
  const envFile = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envFile.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  });
  
  return envVars;
}

const env = loadEnvFile();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const dbPassword = process.argv[2] || process.env.DATABASE_PASSWORD || env.DATABASE_PASSWORD;

if (!supabaseUrl) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL not found');
  console.error('   Set it in .env.local or as environment variable');
  process.exit(1);
}

if (!dbPassword) {
  console.error('❌ Error: Database password required');
  console.error('   Usage: node verify-all-relationships.js [PASSWORD]');
  console.error('   Or set DATABASE_PASSWORD environment variable');
  process.exit(1);
}

// Extract project ref from Supabase URL
const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');

const client = new Client({
  host: `db.${projectRef}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: dbPassword,
  ssl: { rejectUnauthorized: false }
});

async function verifyAllRelationships() {
  try {
    await client.connect();
    console.log('🔍 Comprehensive Relationship Verification\n');
    console.log('='.repeat(70));
    
    // 1. Check Subjects
    console.log('\n1️⃣  SUBJECTS:');
    const subjects = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT CASE WHEN school_id IS NULL THEN id END) as global,
        COUNT(DISTINCT CASE WHEN school_id IS NOT NULL THEN id END) as school_specific
      FROM subjects;
    `);
    console.log(`   Total subjects: ${subjects.rows[0].total}`);
    console.log(`   Global subjects: ${subjects.rows[0].global} (should be 15)`);
    console.log(`   School-specific: ${subjects.rows[0].school_specific} (should be 0)`);
    
    // 2. Check Students -> Classes -> Schools
    console.log('\n2️⃣  STUDENTS -> CLASSES -> SCHOOLS:');
    const studentsRel = await client.query(`
      SELECT 
        COUNT(*) as total_students,
        COUNT(DISTINCT class_id) as classes_with_students,
        COUNT(DISTINCT school_id) as schools_with_students,
        COUNT(CASE WHEN class_id IS NULL THEN 1 END) as orphaned_students
      FROM students;
    `);
    console.log(`   Total students: ${studentsRel.rows[0].total_students}`);
    console.log(`   Classes with students: ${studentsRel.rows[0].classes_with_students}`);
    console.log(`   Schools with students: ${studentsRel.rows[0].schools_with_students}`);
    console.log(`   Orphaned students (no class): ${studentsRel.rows[0].orphaned_students} (should be 0)`);
    
    // Verify students-classes relationship
    const studentsClasses = await client.query(`
      SELECT COUNT(*) as count
      FROM students s
      LEFT JOIN classes c ON c.id = s.class_id
      WHERE s.class_id IS NOT NULL AND c.id IS NULL;
    `);
    console.log(`   Students with invalid class_id: ${studentsClasses.rows[0].count} (should be 0)`);
    
    // Verify students-schools relationship
    const studentsSchools = await client.query(`
      SELECT COUNT(*) as count
      FROM students s
      LEFT JOIN schools sch ON sch.id = s.school_id
      WHERE s.school_id IS NOT NULL AND sch.id IS NULL;
    `);
    console.log(`   Students with invalid school_id: ${studentsSchools.rows[0].count} (should be 0)`);
    
    // 3. Check Grades -> Students -> Subjects
    console.log('\n3️⃣  GRADES -> STUDENTS -> SUBJECTS:');
    const gradesRel = await client.query(`
      SELECT 
        COUNT(*) as total_grades,
        COUNT(DISTINCT student_id) as students_with_grades,
        COUNT(DISTINCT subject_id) as subjects_with_grades,
        COUNT(DISTINCT teacher_id) as teachers_grading
      FROM grades;
    `);
    console.log(`   Total grades: ${gradesRel.rows[0].total_grades}`);
    console.log(`   Students with grades: ${gradesRel.rows[0].students_with_grades}`);
    console.log(`   Subjects with grades: ${gradesRel.rows[0].subjects_with_grades} (should be 15)`);
    console.log(`   Teachers grading: ${gradesRel.rows[0].teachers_grading}`);
    
    // Verify grades-students relationship
    const gradesStudents = await client.query(`
      SELECT COUNT(*) as count
      FROM grades g
      LEFT JOIN students s ON s.id = g.student_id
      WHERE g.student_id IS NOT NULL AND s.id IS NULL;
    `);
    console.log(`   Grades with invalid student_id: ${gradesStudents.rows[0].count} (should be 0)`);
    
    // Verify grades-subjects relationship
    const gradesSubjects = await client.query(`
      SELECT COUNT(*) as count
      FROM grades g
      LEFT JOIN subjects s ON s.id = g.subject_id
      WHERE g.subject_id IS NOT NULL AND s.id IS NULL;
    `);
    console.log(`   Grades with invalid subject_id: ${gradesSubjects.rows[0].count} (should be 0)`);
    
    // 4. Check Homework -> Classes -> Subjects -> Teachers
    console.log('\n4️⃣  HOMEWORK -> CLASSES -> SUBJECTS -> TEACHERS:');
    const homeworkRel = await client.query(`
      SELECT 
        COUNT(*) as total_homework,
        COUNT(DISTINCT class_id) as classes_with_homework,
        COUNT(DISTINCT subject_id) as subjects_with_homework,
        COUNT(DISTINCT teacher_id) as teachers_assigning
      FROM homework;
    `);
    console.log(`   Total homework: ${homeworkRel.rows[0].total_homework}`);
    console.log(`   Classes with homework: ${homeworkRel.rows[0].classes_with_homework}`);
    console.log(`   Subjects with homework: ${homeworkRel.rows[0].subjects_with_homework} (should be 15)`);
    console.log(`   Teachers assigning: ${homeworkRel.rows[0].teachers_assigning}`);
    
    // Verify homework-classes relationship
    const homeworkClasses = await client.query(`
      SELECT COUNT(*) as count
      FROM homework h
      LEFT JOIN classes c ON c.id = h.class_id
      WHERE h.class_id IS NOT NULL AND c.id IS NULL;
    `);
    console.log(`   Homework with invalid class_id: ${homeworkClasses.rows[0].count} (should be 0)`);
    
    // Verify homework-subjects relationship
    const homeworkSubjects = await client.query(`
      SELECT COUNT(*) as count
      FROM homework h
      LEFT JOIN subjects s ON s.id = h.subject_id
      WHERE h.subject_id IS NOT NULL AND s.id IS NULL;
    `);
    console.log(`   Homework with invalid subject_id: ${homeworkSubjects.rows[0].count} (should be 0)`);
    
    // 5. Check Teacher Notes -> Students -> Teachers -> Subjects
    console.log('\n5️⃣  TEACHER NOTES -> STUDENTS -> TEACHERS -> SUBJECTS:');
    const notesRel = await client.query(`
      SELECT 
        COUNT(*) as total_notes,
        COUNT(DISTINCT student_id) as students_with_notes,
        COUNT(DISTINCT teacher_id) as teachers_writing_notes,
        COUNT(DISTINCT subject_id) as subjects_in_notes
      FROM teacher_notes;
    `);
    console.log(`   Total notes: ${notesRel.rows[0].total_notes}`);
    console.log(`   Students with notes: ${notesRel.rows[0].students_with_notes}`);
    console.log(`   Teachers writing notes: ${notesRel.rows[0].teachers_writing_notes}`);
    console.log(`   Subjects in notes: ${notesRel.rows[0].subjects_in_notes} (should be 15)`);
    
    // Verify notes-students relationship
    const notesStudents = await client.query(`
      SELECT COUNT(*) as count
      FROM teacher_notes tn
      LEFT JOIN students s ON s.id = tn.student_id
      WHERE tn.student_id IS NOT NULL AND s.id IS NULL;
    `);
    console.log(`   Notes with invalid student_id: ${notesStudents.rows[0].count} (should be 0)`);
    
    // Verify notes-subjects relationship
    const notesSubjects = await client.query(`
      SELECT COUNT(*) as count
      FROM teacher_notes tn
      LEFT JOIN subjects s ON s.id = tn.subject_id
      WHERE tn.subject_id IS NOT NULL AND s.id IS NULL;
    `);
    console.log(`   Notes with invalid subject_id: ${notesSubjects.rows[0].count} (should be 0)`);
    
    // 6. Check Attendance -> Students -> Classes
    console.log('\n6️⃣  ATTENDANCE -> STUDENTS -> CLASSES:');
    const attendanceRel = await client.query(`
      SELECT 
        COUNT(*) as total_attendance,
        COUNT(DISTINCT student_id) as students_with_attendance,
        COUNT(DISTINCT class_id) as classes_with_attendance,
        COUNT(DISTINCT marked_by) as teachers_marking
      FROM attendance;
    `);
    console.log(`   Total attendance records: ${attendanceRel.rows[0].total_attendance}`);
    console.log(`   Students with attendance: ${attendanceRel.rows[0].students_with_attendance}`);
    console.log(`   Classes with attendance: ${attendanceRel.rows[0].classes_with_attendance}`);
    console.log(`   Teachers marking attendance: ${attendanceRel.rows[0].teachers_marking}`);
    
    // Verify attendance-students relationship
    const attendanceStudents = await client.query(`
      SELECT COUNT(*) as count
      FROM attendance a
      LEFT JOIN students s ON s.id = a.student_id
      WHERE a.student_id IS NOT NULL AND s.id IS NULL;
    `);
    console.log(`   Attendance with invalid student_id: ${attendanceStudents.rows[0].count} (should be 0)`);
    
    // 7. Check Classes -> Schools -> Teachers
    console.log('\n7️⃣  CLASSES -> SCHOOLS -> TEACHERS:');
    const classesRel = await client.query(`
      SELECT 
        COUNT(*) as total_classes,
        COUNT(DISTINCT school_id) as schools_with_classes,
        COUNT(DISTINCT main_teacher_id) as main_teachers,
        COUNT(CASE WHEN main_teacher_id IS NULL THEN 1 END) as classes_without_teacher
      FROM classes;
    `);
    console.log(`   Total classes: ${classesRel.rows[0].total_classes}`);
    console.log(`   Schools with classes: ${classesRel.rows[0].schools_with_classes}`);
    console.log(`   Main teachers assigned: ${classesRel.rows[0].main_teachers}`);
    console.log(`   Classes without main teacher: ${classesRel.rows[0].classes_without_teacher} (should be 0)`);
    
    // 8. Check Users -> Schools
    console.log('\n8️⃣  USERS -> SCHOOLS:');
    const usersRel = await client.query(`
      SELECT 
        role,
        COUNT(*) as count,
        COUNT(DISTINCT school_id) as schools
      FROM users
      WHERE role IN ('admin', 'teacher', 'parent')
      GROUP BY role
      ORDER BY role;
    `);
    usersRel.rows.forEach(row => {
      console.log(`   ${row.role}: ${row.count} users in ${row.schools} schools`);
    });
    
    // 9. Summary - Check for any orphaned records
    console.log('\n9️⃣  DATA INTEGRITY SUMMARY:');
    const orphaned = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM grades g LEFT JOIN students s ON s.id = g.student_id WHERE g.student_id IS NOT NULL AND s.id IS NULL) as orphaned_grades,
        (SELECT COUNT(*) FROM homework h LEFT JOIN classes c ON c.id = h.class_id WHERE h.class_id IS NOT NULL AND c.id IS NULL) as orphaned_homework,
        (SELECT COUNT(*) FROM teacher_notes tn LEFT JOIN students s ON s.id = tn.student_id WHERE tn.student_id IS NOT NULL AND s.id IS NULL) as orphaned_notes,
        (SELECT COUNT(*) FROM attendance a LEFT JOIN students s ON s.id = a.student_id WHERE a.student_id IS NOT NULL AND s.id IS NULL) as orphaned_attendance,
        (SELECT COUNT(*) FROM students s LEFT JOIN classes c ON c.id = s.class_id WHERE s.class_id IS NOT NULL AND c.id IS NULL) as orphaned_students;
    `);
    
    const totalOrphaned = 
      parseInt(orphaned.rows[0].orphaned_grades) +
      parseInt(orphaned.rows[0].orphaned_homework) +
      parseInt(orphaned.rows[0].orphaned_notes) +
      parseInt(orphaned.rows[0].orphaned_attendance) +
      parseInt(orphaned.rows[0].orphaned_students);
    
    if (totalOrphaned === 0) {
      console.log('   ✅ All relationships are properly connected!');
      console.log('   ✅ No orphaned records found!');
    } else {
      console.log('   ⚠️  Orphaned records found:');
      console.log(`      - Orphaned grades: ${orphaned.rows[0].orphaned_grades}`);
      console.log(`      - Orphaned homework: ${orphaned.rows[0].orphaned_homework}`);
      console.log(`      - Orphaned notes: ${orphaned.rows[0].orphaned_notes}`);
      console.log(`      - Orphaned attendance: ${orphaned.rows[0].orphaned_attendance}`);
      console.log(`      - Orphaned students: ${orphaned.rows[0].orphaned_students}`);
    }
    
    // 10. Verify subjects are used in all relationships
    console.log('\n🔟 SUBJECT USAGE VERIFICATION:');
    const subjectUsage = await client.query(`
      SELECT 
        s.name_ar,
        s.name,
        (SELECT COUNT(*) FROM grades g WHERE g.subject_id = s.id) as grades_count,
        (SELECT COUNT(*) FROM homework h WHERE h.subject_id = s.id) as homework_count,
        (SELECT COUNT(*) FROM teacher_notes tn WHERE tn.subject_id = s.id) as notes_count
      FROM subjects s
      WHERE s.school_id IS NULL
      ORDER BY s.name_ar;
    `);
    
    console.log('   Subjects and their usage:');
    subjectUsage.rows.forEach(sub => {
      const total = parseInt(sub.grades_count) + parseInt(sub.homework_count) + parseInt(sub.notes_count);
      console.log(`   - ${sub.name_ar} (${sub.name}): ${sub.grades_count} grades, ${sub.homework_count} homework, ${sub.notes_count} notes (Total: ${total})`);
    });
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ Verification Complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.end();
  }
}

verifyAllRelationships();

