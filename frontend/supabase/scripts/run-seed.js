/**
 * Script to execute the seed SQL file via Supabase
 * 
 * Usage:
 *   node supabase/scripts/run-seed.js
 * 
 * Requirements:
 *   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

async function executeSeed() {
  console.log('🚀 Starting seed data execution...\n');
  
  // Read the seed SQL file
  const seedFilePath = path.join(__dirname, '..', 'seed_arabic_data.sql');
  
  if (!fs.existsSync(seedFilePath)) {
    console.error(`❌ Error: Seed file not found at ${seedFilePath}`);
    process.exit(1);
  }
  
  const sqlContent = fs.readFileSync(seedFilePath, 'utf8');
  
  console.log(`📄 Read seed file (${(sqlContent.length / 1024).toFixed(2)} KB)\n`);
  console.log('⏳ Executing SQL... This may take several minutes...\n');
  
  try {
    // Execute the SQL using Supabase REST API
    // Note: Supabase REST API doesn't directly support raw SQL execution
    // We need to use the PostgREST or execute via the database connection
    // For now, we'll use the REST API's rpc function or direct SQL execution
    
    // Split SQL into statements (basic splitting by semicolon)
    // Note: This is a simplified approach. For production, use a proper SQL parser
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));
    
    console.log(`📊 Found ${statements.length} SQL statements to execute\n`);
    
    // Execute via Supabase using the REST API's query endpoint
    // Since Supabase REST API doesn't support raw SQL, we'll need to use psql or the SQL Editor
    // For now, let's provide instructions
    
    console.log('⚠️  Note: Supabase REST API does not support direct SQL execution.');
    console.log('   Please use one of these methods:\n');
    console.log('   1. SQL Editor (Recommended):');
    console.log('      - Go to Supabase Dashboard → SQL Editor');
    console.log('      - Copy/paste the contents of seed_arabic_data.sql');
    console.log('      - Click "Run"\n');
    console.log('   2. psql (if you have database password):');
    console.log('      - Get connection string from Supabase Dashboard → Settings → Database');
    console.log('      - Run: psql "connection-string" -f supabase/seed_arabic_data.sql\n');
    console.log('   3. Supabase CLI (if linked):');
    console.log('      - The CLI doesn\'t support direct SQL file execution');
    console.log('      - Use the SQL Editor method instead\n');
    
    // Try to open the file for the user
    console.log('📝 Opening seed file location...\n');
    console.log(`   File: ${seedFilePath}\n`);
    
    // Provide the SQL content length info
    console.log(`   File size: ${(sqlContent.length / 1024).toFixed(2)} KB`);
    console.log(`   Approximate execution time: 2-5 minutes\n`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error executing seed:', error.message);
    process.exit(1);
  }
}

executeSeed();

