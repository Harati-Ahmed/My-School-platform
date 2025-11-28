/**
 * Create all auth users for the seed data BEFORE running the seed script
 * 
 * This script creates auth users with predictable emails that the seed script will use.
 * 
 * Usage:
 *   node supabase/scripts/create-all-auth-users.js
 * 
 * Requirements:
 *   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
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

const DEFAULT_PASSWORD = 'Test123!';
const SCHOOL_COUNT = 5;
const TEACHERS_PER_SCHOOL = 12;
const PARENTS_PER_SCHOOL = 24; // 2 per teacher

const maleNames = [
  'أحمد', 'محمد', 'علي', 'حسن', 'حسين', 'عمر', 'خالد', 'يوسف', 'إبراهيم', 'محمود',
  'عبدالله', 'عبدالرحمن', 'سعد', 'طارق', 'باسم', 'فادي', 'رامي', 'وليد', 'نادر', 'مروان',
  'زياد', 'عصام', 'أسامة', 'هشام', 'مازن', 'بسام', 'جمال', 'كمال', 'عادل', 'صالح'
];

const femaleNames = [
  'فاطمة', 'عائشة', 'خديجة', 'مريم', 'زينب', 'سارة', 'نور', 'ليلى', 'ريم', 'سلمى',
  'هند', 'نورا', 'لينا', 'دانا', 'رنا', 'راما', 'تالا', 'يارا', 'ميرا', 'لارا',
  'ميساء', 'هالة', 'نادية', 'سهام', 'منى', 'هدى', 'أمل', 'نجوى', 'وفاء', 'إيمان'
];

const lastNames = [
  'المحمدي', 'الإبراهيمي', 'الحسني', 'العلي', 'الخالدي', 'العباسي', 'الزهراني', 'الغامدي',
  'القحطاني', 'العتيبي', 'الدوسري', 'الشمري', 'الرشيد', 'المالكي', 'النجار', 'الحداد',
  'الصباح', 'الخليفة', 'المنصور', 'السلطان', 'الأمير', 'الشيخ', 'الحكيم', 'العارف',
  'الطيب', 'الكريم', 'الفتاح', 'الرحيم', 'الغفور', 'الودود'
];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function createAuthUser(email, name, role, existingUsersMap) {
  try {
    // Check if user already exists in our map
    if (existingUsersMap.has(email)) {
      return { id: existingUsersMap.get(email), email, created: false };
    }

    // Create new user
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: {
        name,
        role,
      }
    });

    if (error) {
      // If user already exists, look it up and add to map
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        // Search for the user by email (may need to paginate)
        let found = false;
        let page = 0;
        const perPage = 1000;
        
        while (!found) {
          const { data: retryUsers, error: listError } = await supabase.auth.admin.listUsers({
            page,
            perPage
          });
          
          if (listError || !retryUsers?.users || retryUsers.users.length === 0) break;
          
          const retryUser = retryUsers.users.find(u => u.email === email);
          if (retryUser) {
            existingUsersMap.set(email, retryUser.id);
            return { id: retryUser.id, email, created: false };
          }
          
          // If we got fewer users than perPage, we've reached the end
          if (retryUsers.users.length < perPage) break;
          page++;
        }
        
        // If still not found, return null (user exists but we can't find it)
        return null;
      }
      throw error;
    }

    // Add to map for future checks
    existingUsersMap.set(email, data.user.id);
    return { id: data.user.id, email, created: true };
  } catch (error) {
    // Silently handle "already exists" errors - they're expected
    if (error.message && (error.message.includes('already registered') || error.message.includes('already exists'))) {
      return null; // Will be handled by the lookup above
    }
    console.error(`❌ Failed to create ${email}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Creating auth users for seed data...\n');
  
  // Fetch all existing users once at the start (handle pagination)
  console.log('📋 Checking existing users...');
  const existingUsersMap = new Map();
  let page = 0;
  const perPage = 1000;
  let totalFound = 0;
  
  while (true) {
    const { data: allUsers, error } = await supabase.auth.admin.listUsers({
      page,
      perPage
    });
    
    if (error || !allUsers?.users || allUsers.users.length === 0) break;
    
    allUsers.users.forEach(user => {
      if (user.email) {
        existingUsersMap.set(user.email, user.id);
        totalFound++;
      }
    });
    
    // If we got fewer users than perPage, we've reached the end
    if (allUsers.users.length < perPage) break;
    page++;
  }
  
  console.log(`   Found ${totalFound} existing users\n`);
  
  const users = [];
  let created = 0;
  let existing = 0;
  let failed = 0;

  // Create admins
  for (let i = 1; i <= SCHOOL_COUNT; i++) {
    const firstName = getRandomElement(maleNames);
    const lastName = getRandomElement(lastNames);
    const name = `${firstName} ${lastName}`;
    const email = `admin${i}@school${i}.ly`;
    
    const result = await createAuthUser(email, name, 'admin', existingUsersMap);
    if (result) {
      users.push({ ...result, name, role: 'admin', schoolIndex: i });
      if (result.created) created++;
      else existing++;
    } else {
      failed++;
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // Create teachers
  for (let i = 1; i <= SCHOOL_COUNT; i++) {
    for (let j = 1; j <= TEACHERS_PER_SCHOOL; j++) {
      const isFemale = j % 3 === 0;
      const firstName = getRandomElement(isFemale ? femaleNames : maleNames);
      const lastName = getRandomElement(lastNames);
      const name = `${firstName} ${lastName}`;
      const email = `teacher${j}@school${i}.ly`;
      
      const result = await createAuthUser(email, name, 'teacher', existingUsersMap);
      if (result) {
        users.push({ ...result, name, role: 'teacher', schoolIndex: i, teacherIndex: j });
        if (result.created) created++;
        else existing++;
      } else {
        failed++;
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  // Create parents
  for (let i = 1; i <= SCHOOL_COUNT; i++) {
    for (let j = 1; j <= TEACHERS_PER_SCHOOL; j++) {
      for (let k = 1; k <= 2; k++) {
        const firstName = getRandomElement(maleNames);
        const lastName = getRandomElement(lastNames);
        const name = `${firstName} ${lastName}`;
        const email = `parent${j * 2 + k}@school${i}.ly`;
        
        const result = await createAuthUser(email, name, 'parent', existingUsersMap);
        if (result) {
          users.push({ ...result, name, role: 'parent', schoolIndex: i, parentIndex: j * 2 + k });
          if (result.created) created++;
          else existing++;
        } else {
          failed++;
        }
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }

  // Create additional parents for students
  // Seed script uses: parent${j * students_per_class + k} where j=class(1-8), k=student(1-25)
  // So we need parents numbered from 26 (1*25+1) to 225 (8*25+25)
  // Plus the initial 24 parents (parent3 to parent26 from teachers)
  // So we need parents from parent1 to at least parent225
  const MAX_PARENT_NUMBER = 250; // Extra buffer
  
  for (let i = 1; i <= SCHOOL_COUNT; i++) {
    // Create parents numbered 1-250 to cover all possible patterns
    for (let p = 1; p <= MAX_PARENT_NUMBER; p++) {
      // Skip parents already created above (parent3 to parent26 from teachers loop)
      if (p >= 3 && p <= 26) continue;
      
      const firstName = getRandomElement(maleNames);
      const lastName = getRandomElement(lastNames);
      const name = `${firstName} ${lastName}`;
      const email = `parent${p}@school${i}.ly`;
      
      const result = await createAuthUser(email, name, 'parent', existingUsersMap);
      if (result) {
        users.push({ ...result, name, role: 'parent', schoolIndex: i });
        if (result.created) created++;
        else existing++;
      } else {
        failed++;
      }
      await new Promise(resolve => setTimeout(resolve, 20));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary:');
  console.log(`   ✅ Created: ${created}`);
  console.log(`   ⏭️  Already existed: ${existing}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📝 Total: ${users.length}`);
  console.log('='.repeat(60));

  console.log('\n✅ Auth users created! You can now run the seed script.');
  console.log(`\n📝 Default password for all users: ${DEFAULT_PASSWORD}\n`);

  return users;
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

