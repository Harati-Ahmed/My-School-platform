/**
 * Verify seed data was created
 * 
 * Usage:
 *   node verify-seed.js [PASSWORD]
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
  console.error('   Usage: node verify-seed.js [PASSWORD]');
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

async function verify() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    
    const result = await client.query(`
      SELECT 
        'Schools' as entity, COUNT(*)::INTEGER as count FROM schools
      UNION ALL
      SELECT 'Users', COUNT(*)::INTEGER FROM users
      UNION ALL
      SELECT 'Teachers', COUNT(*)::INTEGER FROM users WHERE role = 'teacher'
      UNION ALL
      SELECT 'Parents', COUNT(*)::INTEGER FROM users WHERE role = 'parent'
      UNION ALL
      SELECT 'Admins', COUNT(*)::INTEGER FROM users WHERE role = 'admin'
      UNION ALL
      SELECT 'Classes', COUNT(*)::INTEGER FROM classes
      UNION ALL
      SELECT 'Students', COUNT(*)::INTEGER FROM students
      UNION ALL
      SELECT 'Subjects', COUNT(*)::INTEGER FROM subjects
      UNION ALL
      SELECT 'Attendance Records', COUNT(*)::INTEGER FROM attendance
      UNION ALL
      SELECT 'Grades', COUNT(*)::INTEGER FROM grades
      UNION ALL
      SELECT 'Homework', COUNT(*)::INTEGER FROM homework
      UNION ALL
      SELECT 'Teacher Notes', COUNT(*)::INTEGER FROM teacher_notes
      UNION ALL
      SELECT 'Announcements', COUNT(*)::INTEGER FROM announcements
      ORDER BY entity;
    `);
    
    console.log('📊 Seed Data Summary:');
    console.log('='.repeat(50));
    result.rows.forEach(row => {
      console.log(`   ${row.entity.padEnd(25)} ${row.count.toLocaleString()}`);
    });
    console.log('='.repeat(50));
    
    // School details
    const schools = await client.query(`
      SELECT 
        s.name_ar as "اسم المدرسة",
        COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'teacher') as "عدد المعلمين",
        COUNT(DISTINCT st.id) as "عدد الطلاب",
        COUNT(DISTINCT c.id) as "عدد الفصول",
        COUNT(DISTINCT sub.id) as "عدد المواد"
      FROM schools s
      LEFT JOIN users u ON u.school_id = s.id
      LEFT JOIN students st ON st.school_id = s.id
      LEFT JOIN classes c ON c.school_id = s.id
      LEFT JOIN subjects sub ON sub.school_id = s.id
      GROUP BY s.id, s.name_ar
      ORDER BY s.name_ar;
    `);
    
    console.log('\n📚 School Details:');
    schools.rows.forEach(school => {
      console.log(`\n   ${school['اسم المدرسة']}:`);
      console.log(`      Teachers: ${school['عدد المعلمين']}`);
      console.log(`      Students: ${school['عدد الطلاب']}`);
      console.log(`      Classes: ${school['عدد الفصول']}`);
      console.log(`      Subjects: ${school['عدد المواد']}`);
    });
    
    console.log('\n✅ Verification complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

verify();

