# Quick Start: Arabic Test Data

## 🚀 Fastest Way to Get Test Data

### Step 1: Create Auth Users FIRST (Required!)

**IMPORTANT:** You MUST create auth users BEFORE running the seed script!

```bash
# Make sure you're in the frontend directory
cd /Users/macbookpro/My-School-platform/frontend

# Run the auth user creation script
node supabase/scripts/create-all-auth-users.js
```

**Or from project root:**
```bash
cd /Users/macbookpro/My-School-platform
node frontend/supabase/scripts/create-all-auth-users.js
```

This will create all auth users needed for the seed data. It may take 5-10 minutes as it creates ~1,000+ users.

**Note:** If users already exist, the script will skip them and continue.

### Step 2: Run the Seed Script

After auth users are created, run the seed script:

```bash
# Option A: Using SQL Editor (Recommended)
# 1. Open: https://scqdrwismklrrcuabtxq.supabase.co
# 2. Go to: SQL Editor → New Query
# 3. Copy/paste the contents of: frontend/supabase/seed_arabic_data.sql
# 4. Click "Run"

# Option B: Copy to clipboard
cat supabase/seed_arabic_data.sql | pbcopy
# Then paste into SQL Editor
```

**Or manually via Dashboard:**
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user" → "Create new user"
3. For each user in your database, create an auth user with:
   - Email: (from users table)
   - Password: `Test123!`
   - Auto Confirm: ✅ Yes

### Step 3: Verify

```sql
-- Check what was created
SELECT 
    'Schools' as entity, COUNT(*) as count FROM schools
UNION ALL
SELECT 'Users', COUNT(*) FROM users
UNION ALL
SELECT 'Students', COUNT(*) FROM students
UNION ALL
SELECT 'Grades', COUNT(*) FROM grades;
```

## 📊 What You'll Get

- **5 Schools** with Arabic names
- **60 Teachers** 
- **120 Parents**
- **1,000 Students**
- **40 Classes**
- **320 Subjects** (Arabic subjects)
- **60,000+ Attendance Records**
- **15,000+ Grades**
- **1,600 Homework Assignments**
- **600 Teacher Notes**
- **40 Announcements**

All with Arabic names, subjects, and content!

## 🔑 Default Login Credentials

After creating auth users, you can login with:
- **Email**: Any email from the seed (e.g., `admin1@school1.ly`)
- **Password**: `Test123!`

## ⚙️ Customization

Edit these variables in `seed_arabic_data.sql` to change the amount of data:

```sql
school_count INTEGER := 5;              -- Change number of schools
teachers_per_school INTEGER := 12;      -- Teachers per school
students_per_class INTEGER := 25;       -- Students per class
attendance_days INTEGER := 60;          -- Days of attendance
```

## 🐛 Troubleshooting

**"relation does not exist"**
→ Run migrations first: `supabase db push`

**"duplicate key value"**
→ Truncate tables and re-run

**"auth user not found"**
→ Run the create-auth-users.js script

## 📚 More Info

See `SEED_README.md` for detailed documentation.

