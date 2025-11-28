const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Read .env.local
function loadEnvFile() {
  const envPath = path.join(__dirname, '../../.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ Error: .env.local file not found');
    process.exit(1);
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
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const dbPassword = process.argv[2] || process.env.DATABASE_PASSWORD;

if (!supabaseUrl) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL not found in .env.local');
  process.exit(1);
}

if (!dbPassword) {
  console.error('❌ Error: Database password required');
  console.error('   Usage: node fix-subjects-rls.js [PASSWORD]');
  console.error('   Or set DATABASE_PASSWORD environment variable');
  process.exit(1);
}

// Extract project ref from URL
const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');

// Connection config
const connectionConfig = {
  host: `db.${projectRef}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: dbPassword,
  ssl: { rejectUnauthorized: false }
};

async function runMigration() {
  const client = new Client(connectionConfig);
  
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/20240106_fix_subjects_rls_global.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Running migration: Fix Subjects RLS for Global Subjects');
    
    await client.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the fix by checking if we can query subjects
    const result = await client.query(`
      SELECT COUNT(*) as count 
      FROM subjects 
      WHERE school_id IS NULL AND is_active = true
    `);
    
    console.log(`\n📊 Global subjects count: ${result.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error running migration:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();

