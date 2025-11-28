/**
 * Helper script to create auth users for the seed data
 * 
 * This script reads user data from the database and creates corresponding
 * auth users in Supabase Auth.
 * 
 * Usage:
 *   node scripts/create-auth-users.js
 * 
 * Requirements:
 *   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 *   - Users must already exist in the users table (run seed script first)
 */

require('dotenv').config({ path: '.env.local' });
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

// Default password for all test users
const DEFAULT_PASSWORD = 'Test123!';

/**
 * Create auth user from user profile
 */
async function createAuthUser(user) {
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: {
        name: user.name,
        role: user.role,
      }
    });

    if (error) {
      // If user already exists, try to update
      if (error.message.includes('already registered')) {
        console.log(`⚠️  User ${user.email} already exists, updating...`);
        const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
          user.id,
          {
            email: user.email,
            user_metadata: {
              name: user.name,
              role: user.role,
            }
          }
        );
        
        if (updateError) {
          console.error(`❌ Failed to update ${user.email}:`, updateError.message);
          return null;
        }
        
        console.log(`✅ Updated auth user: ${user.email} (${user.id})`);
        return updateData.user;
      }
      
      console.error(`❌ Failed to create ${user.email}:`, error.message);
      return null;
    }

    // Update the users table with the auth user ID if it doesn't match
    if (data.user && data.user.id !== user.id) {
      console.log(`⚠️  UUID mismatch for ${user.email}. Updating users table...`);
      const { error: updateError } = await supabase
        .from('users')
        .update({ id: data.user.id })
        .eq('email', user.email);
      
      if (updateError) {
        console.error(`❌ Failed to update users table:`, updateError.message);
      }
    }

    console.log(`✅ Created auth user: ${user.email} (${data.user.id})`);
    return data.user;
  } catch (error) {
    console.error(`❌ Error creating ${user.email}:`, error.message);
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting auth user creation...\n');

  // Fetch all users from the database
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, name, role')
    .order('role', { ascending: true })
    .order('email', { ascending: true });

  if (error) {
    console.error('❌ Error fetching users:', error.message);
    process.exit(1);
  }

  if (!users || users.length === 0) {
    console.log('⚠️  No users found in the database.');
    console.log('   Please run the seed script first to create user profiles.');
    process.exit(1);
  }

  console.log(`📊 Found ${users.length} users to process\n`);

  // Group by role for better output
  const byRole = {
    admin: users.filter(u => u.role === 'admin'),
    teacher: users.filter(u => u.role === 'teacher'),
    parent: users.filter(u => u.role === 'parent'),
  };

  console.log(`   - ${byRole.admin.length} admins`);
  console.log(`   - ${byRole.teacher.length} teachers`);
  console.log(`   - ${byRole.parent.length} parents\n`);

  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;

  // Process users
  for (const user of users) {
    // Check if auth user already exists
    const { data: existingUser } = await supabase.auth.admin.getUserById(user.id);
    
    if (existingUser?.user) {
      console.log(`⏭️  Skipping ${user.email} (already exists)`);
      skipCount++;
      continue;
    }

    const result = await createAuthUser(user);
    if (result) {
      successCount++;
    } else {
      failCount++;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log(`   ✅ Created: ${successCount}`);
  console.log(`   ⏭️  Skipped: ${skipCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log('='.repeat(50));

  if (failCount > 0) {
    console.log('\n⚠️  Some users failed to create. Check the errors above.');
    process.exit(1);
  }

  console.log('\n✅ All auth users created successfully!');
  console.log(`\n📝 Default password for all users: ${DEFAULT_PASSWORD}`);
  console.log('   Please change passwords after first login.\n');
}

// Run the script
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

