/**
 * Execute seed script directly via PostgreSQL connection
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

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

if (!dbPassword) {
  console.error('❌ Error: Database password required');
  console.error('Usage: node run-seed-direct.js [PASSWORD]');
  console.error('Or set DATABASE_PASSWORD environment variable');
  process.exit(1);
}

// Extract project ref from URL
const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');

// Try different connection formats
const connectionConfigs = [
  {
    host: `db.${projectRef}.supabase.co`,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: dbPassword,
    ssl: { rejectUnauthorized: false }
  },
  {
    host: `aws-1-eu-west-1.pooler.supabase.com`,
    port: 5432,
    database: 'postgres',
    user: `postgres.${projectRef}`,
    password: dbPassword,
    ssl: { rejectUnauthorized: false }
  }
];

async function runSeed() {
  console.log('🚀 Executing seed script via PostgreSQL...\n');
  
  const seedFile = path.join(__dirname, '..', 'seed_arabic_data.sql');
  const sql = fs.readFileSync(seedFile, 'utf8');
  
  console.log(`📄 Read seed file (${(sql.length / 1024).toFixed(2)} KB)\n`);
  
  let client;
  let connected = false;
  
  // Try each connection config
  for (const config of connectionConfigs) {
    try {
      console.log(`🔌 Trying connection to ${config.host}...`);
      client = new Client(config);
      await client.connect();
      console.log('✅ Connected!\n');
      connected = true;
      break;
    } catch (error) {
      console.log(`❌ Failed: ${error.message}\n`);
      if (client) {
        await client.end().catch(() => {});
      }
    }
  }
  
  if (!connected) {
    console.error('❌ Could not connect to database');
    console.error('Please check your password and connection settings');
    process.exit(1);
  }
  
  try {
    console.log('⏳ Executing SQL... This will take 5-10 minutes...\n');
    
    // Set statement timeout to 30 minutes
    await client.query('SET statement_timeout = 1800000'); // 30 minutes in milliseconds
    
    // Execute the SQL
    await client.query(sql);
    console.log('\n✅ Seed script executed successfully!');
  } catch (error) {
    console.error('\n❌ Error executing seed script:');
    console.error(error.message);
    if (error.position) {
      console.error(`Error at position: ${error.position}`);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSeed().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

