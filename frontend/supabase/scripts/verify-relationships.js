/**
 * Verify all data relationships are correct
 * 
 * Usage:
 *   node verify-relationships.js [PASSWORD]
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
  console.error('   Usage: node verify-relationships.js [PASSWORD]');
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

async function verifyRelationships() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    console.log('🔍 Verifying data relationships...\n');
    
    // Check subjects
    const subjects = await client.query(`
      SELECT s.id, s.name, s.name_ar, s.school_id, sch.name_ar as school_name
      FROM subjects s
      JOIN schools sch ON sch.id = s.school_id
      ORDER BY sch.name_ar, s.name;
    `);
    
    console.log('📚 Subjects (should be 1 per school - Math):');
    subjects.rows.forEach(sub => {
      console.log(`   ${sub.school_name}: ${sub.name_ar} (${sub.name})`);
    });
    console.log(`\n   Total: ${subjects.rows.length} subjects\n`);
    
    // Check grades relationships
    const gradesCheck = await client.query(`
      SELECT 
        COUNT(*) as total_grades,
        COUNT(DISTINCT student_id) as students_with_grades,
        COUNT(DISTINCT subject_id) as subjects_used,
        COUNT(DISTINCT teacher_id) as teachers_grading
      FROM grades;
    `);
    
    console.log('📊 Grades Relationships:');
    console.log(`   Total grades: ${gradesCheck.rows[0].total_grades}`);
    console.log(`   Students with grades: ${gradesCheck.rows[0].students_with_grades}`);
    console.log(`   Subjects used: ${gradesCheck.rows[0].subjects_used} (should be 5 - one per school)`);
    console.log(`   Teachers grading: ${gradesCheck.rows[0].teachers_grading}\n`);
    
    // Check homework relationships
    const homeworkCheck = await client.query(`
      SELECT 
        COUNT(*) as total_homework,
        COUNT(DISTINCT class_id) as classes_with_homework,
        COUNT(DISTINCT subject_id) as subjects_used,
        COUNT(DISTINCT teacher_id) as teachers_assigning
      FROM homework;
    `);
    
    console.log('📝 Homework Relationships:');
    console.log(`   Total homework: ${homeworkCheck.rows[0].total_homework}`);
    console.log(`   Classes with homework: ${homeworkCheck.rows[0].classes_with_homework}`);
    console.log(`   Subjects used: ${homeworkCheck.rows[0].subjects_used} (should be 5)`);
    console.log(`   Teachers assigning: ${homeworkCheck.rows[0].teachers_assigning}\n`);
    
    // Check students-classes relationship
    const studentsCheck = await client.query(`
      SELECT 
        COUNT(*) as total_students,
        COUNT(DISTINCT class_id) as classes_with_students,
        COUNT(DISTINCT school_id) as schools_with_students
      FROM students;
    `);
    
    console.log('👥 Students Relationships:');
    console.log(`   Total students: ${studentsCheck.rows[0].total_students}`);
    console.log(`   Classes with students: ${studentsCheck.rows[0].classes_with_students}`);
    console.log(`   Schools with students: ${studentsCheck.rows[0].schools_with_students}\n`);
    
    // Check for orphaned records
    const orphanedGrades = await client.query(`
      SELECT COUNT(*) as count
      FROM grades g
      LEFT JOIN students st ON st.id = g.student_id
      LEFT JOIN subjects s ON s.id = g.subject_id
      WHERE st.id IS NULL OR s.id IS NULL;
    `);
    
    const orphanedHomework = await client.query(`
      SELECT COUNT(*) as count
      FROM homework h
      LEFT JOIN classes c ON c.id = h.class_id
      LEFT JOIN subjects s ON s.id = h.subject_id
      WHERE c.id IS NULL OR s.id IS NULL;
    `);
    
    console.log('🔗 Data Integrity Check:');
    console.log(`   Orphaned grades: ${orphanedGrades.rows[0].count} (should be 0)`);
    console.log(`   Orphaned homework: ${orphanedHomework.rows[0].count} (should be 0)\n`);
    
    if (orphanedGrades.rows[0].count === 0 && orphanedHomework.rows[0].count === 0) {
      console.log('✅ All relationships are properly connected!\n');
    } else {
      console.log('⚠️  Warning: Some orphaned records found!\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

verifyRelationships();

