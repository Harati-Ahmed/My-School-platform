/**
 * Cleanup all data from database
 * 
 * Usage:
 *   node cleanup-all-data.js [PASSWORD]
 * 
 * Or set environment variables:
 *   DATABASE_PASSWORD=your-password
 *   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

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
  console.error('   Usage: node cleanup-all-data.js [PASSWORD]');
  console.error('   Or set DATABASE_PASSWORD environment variable');
  process.exit(1);
}

// Extract project ref from Supabase URL
const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');

const sql = fs.readFileSync(path.join(__dirname, 'cleanup-all-data.sql'), 'utf8');

const client = new Client({
  host: `db.${projectRef}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: dbPassword,
  ssl: { rejectUnauthorized: false }
});

async function cleanup() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    console.log('⚠️  WARNING: This will delete ALL data from the database!\n');
    console.log('⏳ Cleaning up all data...\n');
    
    await client.query('SET statement_timeout = 60000'); // 60 seconds
    await client.query(sql);
    
    // Get verification counts
    const result = await client.query(`
      SELECT 
        'schools' as table_name, COUNT(*)::INTEGER as count FROM schools
      UNION ALL
      SELECT 'users', COUNT(*)::INTEGER FROM users WHERE role IN ('teacher', 'parent', 'admin')
      UNION ALL
      SELECT 'subjects', COUNT(*)::INTEGER FROM subjects
      UNION ALL
      SELECT 'classes', COUNT(*)::INTEGER FROM classes
      UNION ALL
      SELECT 'students', COUNT(*)::INTEGER FROM students
      UNION ALL
      SELECT 'grades', COUNT(*)::INTEGER FROM grades
      UNION ALL
      SELECT 'homework', COUNT(*)::INTEGER FROM homework
      UNION ALL
      SELECT 'attendance', COUNT(*)::INTEGER FROM attendance
      UNION ALL
      SELECT 'teacher_notes', COUNT(*)::INTEGER FROM teacher_notes
      UNION ALL
      SELECT 'announcements', COUNT(*)::INTEGER FROM announcements
      ORDER BY table_name;
    `);
    
    console.log('📊 Verification - Remaining records:');
    console.log('='.repeat(50));
    result.rows.forEach(row => {
      console.log(`   ${row.table_name.padEnd(20)} ${row.count}`);
    });
    console.log('='.repeat(50));
    
    console.log('\n✅ Cleanup completed successfully!');
    console.log('   All data has been deleted. Ready for fresh seed.\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.position) {
      console.error(`Error at position: ${error.position}`);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

cleanup();

