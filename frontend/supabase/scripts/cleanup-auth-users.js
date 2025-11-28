/**
 * Cleanup auth users
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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function cleanupAuthUsers() {
  console.log('🧹 Cleaning up auth users...\n');
  
  try {
    let page = 1;
    let hasMore = true;
    let totalDeleted = 0;
    
    while (hasMore) {
      const { data: users, error } = await supabase.auth.admin.listUsers({
        page,
        perPage: 1000
      });
      
      if (error) {
        console.error('❌ Error listing users:', error.message);
        break;
      }
      
      if (!users || users.users.length === 0) {
        hasMore = false;
        break;
      }
      
      // Delete users in batch
      for (const user of users.users) {
        // Skip service role and system users
        if (user.email && (user.email.includes('@supabase') || user.email.includes('admin@'))) {
          continue;
        }
        
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        if (deleteError) {
          console.error(`⚠️  Failed to delete user ${user.email}:`, deleteError.message);
        } else {
          totalDeleted++;
        }
      }
      
      console.log(`   Deleted ${users.users.length} users (page ${page})...`);
      
      if (users.users.length < 1000) {
        hasMore = false;
      } else {
        page++;
      }
    }
    
    console.log(`\n✅ Cleaned up ${totalDeleted} auth users\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanupAuthUsers();

