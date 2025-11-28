/**
 * Verify subjects are created correctly
 * 
 * Usage:
 *   node verify-subjects.js [PASSWORD]
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
  console.error('   Usage: node verify-subjects.js [PASSWORD]');
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

async function verifySubjects() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    
    // Get subjects per school
    const subjects = await client.query(`
      SELECT 
        sch.name_ar as school_name,
        COUNT(DISTINCT s.id) as subject_count,
        STRING_AGG(DISTINCT s.name_ar, ', ' ORDER BY s.name_ar) as subjects_list
      FROM schools sch
      LEFT JOIN subjects s ON s.school_id = sch.id
      GROUP BY sch.id, sch.name_ar
      ORDER BY sch.name_ar;
    `);
    
    console.log('📚 Subjects per School (should be 15 subjects each):');
    console.log('='.repeat(70));
    subjects.rows.forEach(row => {
      console.log(`\n${row.school_name}:`);
      console.log(`   Count: ${row.subject_count} subjects`);
      console.log(`   Subjects: ${row.subjects_list}`);
    });
    console.log('\n' + '='.repeat(70));
    
    // Check for duplicates
    const duplicates = await client.query(`
      SELECT 
        sch.name_ar as school_name,
        s.name_ar as subject_name,
        COUNT(*) as count
      FROM subjects s
      JOIN schools sch ON sch.id = s.school_id
      GROUP BY sch.id, sch.name_ar, s.name_ar
      HAVING COUNT(*) > 1;
    `);
    
    if (duplicates.rows.length === 0) {
      console.log('\n✅ No duplicate subjects found - each subject is created only once per school!\n');
    } else {
      console.log('\n⚠️  Duplicate subjects found:');
      duplicates.rows.forEach(row => {
        console.log(`   ${row.school_name} - ${row.subject_name}: ${row.count} times`);
      });
    }
    
    // Total subjects
    const total = await client.query(`SELECT COUNT(*) as count FROM subjects;`);
    console.log(`\n📊 Total subjects: ${total.rows[0].count} (should be 5 schools × 15 subjects = 75)\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

verifySubjects();

