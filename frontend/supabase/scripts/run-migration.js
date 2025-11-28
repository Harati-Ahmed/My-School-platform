/**
 * Run a migration file
 * 
 * Usage:
 *   node run-migration.js <migration-file> [PASSWORD]
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
const migrationFile = process.argv[2];
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const dbPassword = process.argv[3] || process.env.DATABASE_PASSWORD || env.DATABASE_PASSWORD;

if (!migrationFile) {
  console.error('❌ Error: Migration file required');
  console.error('Usage: node run-migration.js <migration-file> [PASSWORD]');
  process.exit(1);
}

if (!supabaseUrl) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL not found');
  console.error('   Set it in .env.local or as environment variable');
  process.exit(1);
}

if (!dbPassword) {
  console.error('❌ Error: Database password required');
  console.error('   Usage: node run-migration.js <migration-file> [PASSWORD]');
  console.error('   Or set DATABASE_PASSWORD environment variable');
  process.exit(1);
}

if (!fs.existsSync(migrationFile)) {
  console.error(`❌ Error: Migration file not found: ${migrationFile}`);
  process.exit(1);
}

const sql = fs.readFileSync(migrationFile, 'utf8');

// Extract project ref from Supabase URL
const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');

const client = new Client({
  host: `db.${projectRef}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: dbPassword,
  ssl: { rejectUnauthorized: false },
  statement_timeout: 30000 // 30 seconds
});

async function runMigration() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    console.log('⏳ Running migration...\n');
    
    await client.query('SET statement_timeout = 30000');
    await client.query(sql);
    
    console.log('✅ Migration completed successfully!\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.position) {
      console.error(`Error at position: ${error.position}`);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();

