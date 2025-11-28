/**
 * Run seed script via Supabase connection
 * 
 * Usage:
 *   node supabase/scripts/run-seed-cli.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Read .env.local file manually
function loadEnvFile() {
  const envPath = path.join(__dirname, '../../.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ Error: .env.local file not found at', envPath);
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
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runSeed() {
  console.log('🚀 Running seed script via Supabase API...\n');
  
  const seedFilePath = path.join(__dirname, '..', 'seed_arabic_data.sql');
  
  if (!fs.existsSync(seedFilePath)) {
    console.error(`❌ Error: Seed file not found at ${seedFilePath}`);
    process.exit(1);
  }
  
  const sqlContent = fs.readFileSync(seedFilePath, 'utf8');
  
  console.log(`📄 Read seed file (${(sqlContent.length / 1024).toFixed(2)} KB)\n`);
  console.log('⏳ Executing SQL... This may take 5-10 minutes...\n');
  
  try {
    // Execute SQL using Supabase REST API's rpc or direct query
    // Note: Supabase REST API doesn't support raw SQL directly
    // We need to use the PostgREST query builder or execute via database connection
    
    // Split into statements and execute one by one
    // This is a simplified approach - for production, use proper SQL parser
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.match(/^\/\*/));
    
    console.log(`📊 Found ${statements.length} SQL statements\n`);
    console.log('⚠️  Note: Supabase REST API does not support direct SQL execution.');
    console.log('   Please use one of these methods:\n');
    console.log('   1. SQL Editor (Recommended):');
    console.log('      - Go to: https://scqdrwismklrrcuabtxq.supabase.co');
    console.log('      - SQL Editor → New Query');
    console.log('      - Copy/paste seed_arabic_data.sql');
    console.log('      - Click "Run"\n');
    console.log('   2. psql (if you have database password):');
    console.log('      - Get connection string from Supabase Dashboard → Settings → Database');
    console.log('      - Run: psql "connection-string" -f supabase/seed_arabic_data.sql\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

runSeed();

