/**
 * Execute seed script via Supabase
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSeed() {
  console.log('🚀 Executing seed script...\n');
  
  const seedFile = path.join(__dirname, '..', 'seed_arabic_data.sql');
  const sql = fs.readFileSync(seedFile, 'utf8');
  
  console.log(`📄 Read seed file (${(sql.length / 1024).toFixed(2)} KB)\n`);
  console.log('⏳ Executing SQL... This will take 5-10 minutes...\n');
  
  try {
    // Execute via Supabase REST API using rpc or direct query
    // Since Supabase REST API doesn't support raw SQL, we'll use the PostgREST query
    // Actually, we need to use the database connection directly
    
    // Use the Supabase client's rpc function to execute SQL
    // But rpc requires a function, so we'll need to create a temporary function or use direct connection
    
    // For now, let's try using the REST API's query endpoint
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ sql })
    });
    
    if (!response.ok) {
      // If rpc doesn't work, we need to use psql or SQL Editor
      console.log('⚠️  Direct SQL execution via API is not available.');
      console.log('   Supabase REST API does not support raw SQL execution.\n');
      console.log('   Please use one of these methods:\n');
      console.log('   1. SQL Editor (Recommended):');
      console.log(`      - Open: ${supabaseUrl}`);
      console.log('      - Go to: SQL Editor → New Query');
      console.log('      - Paste the seed file contents');
      console.log('      - Click "Run"\n');
      console.log('   2. psql (requires database password):');
      console.log('      - Get password from: Supabase Dashboard → Settings → Database');
      console.log('      - Run: ./supabase/scripts/run-seed-psql.sh YOUR_PASSWORD\n');
      
      // Copy to clipboard as fallback
      const { execSync } = require('child_process');
      try {
        execSync(`cat "${seedFile}" | pbcopy`);
        console.log('✅ Seed file copied to clipboard for easy pasting!\n');
      } catch (e) {
        // Ignore
      }
      
      process.exit(1);
    }
    
    const result = await response.json();
    console.log('✅ Seed script executed successfully!');
    console.log(result);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

executeSeed();

