# Arabic Test Data Seed Script

This comprehensive seed script generates large-scale Arabic-themed test data for the Tilmeedhy school management platform.

## 📊 What Gets Created

- **5 Schools** with Arabic names and Libyan addresses
- **60 Teachers** (12 per school) with Arabic names
- **120 Parents** (24 per school) with Arabic names
- **1,000 Students** (200 per school, 25 per class) with Arabic names
- **40 Classes** (8 per school) across different grade levels
- **320 Subjects** (8 per class) including Arabic subjects like:
  - الرياضيات (Mathematics)
  - اللغة العربية (Arabic Language)
  - العلوم (Science)
  - التربية الإسلامية (Islamic Education)
  - اللغة الإنجليزية (English Language)
  - التاريخ (History)
  - الجغرافيا (Geography)
  - الفيزياء (Physics)
  - الكيمياء (Chemistry)
  - الأحياء (Biology)
  - And more...
- **60,000+ Attendance Records** (60 days per student, excluding weekends)
- **15,000+ Grades** (15 per student) with Arabic exam names and feedback
- **1,600 Homework Assignments** (5 per subject) with Arabic titles
- **600 Teacher Notes** (10 per teacher) in Arabic
- **40 Announcements** (8 per school) with Arabic content

## 🚀 How to Run

### Option 1: Using Supabase CLI (Recommended)

```bash
# Navigate to your project
cd frontend

# Make sure you're linked to your Supabase project
supabase link --project-ref your-project-ref

# Run the seed script
supabase db seed seed_arabic_data.sql
```

### Option 2: Using Supabase SQL Editor

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy and paste the entire contents of `seed_arabic_data.sql`
5. Click **Run** (or press Cmd/Ctrl + Enter)

### Option 3: Using psql

```bash
# Export your connection string
export DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run the script
psql $DATABASE_URL -f supabase/seed_arabic_data.sql
```

## ⚠️ Important Notes

### Auth Users Must Be Created First

This script creates user profiles in the `users` table, but **you must create the corresponding auth users in Supabase Auth first**. The script generates UUIDs for users, but these need to match actual auth.users records.

### Creating Auth Users

You have several options:

#### Option A: Create via Supabase Dashboard (Manual)

1. Go to **Authentication** → **Users** → **Add user**
2. For each user in the seed script, create an auth user with:
   - Email: `admin1@school1.ly`, `teacher1@school1.ly`, etc.
   - Password: Use a default like `Test123!` or generate random passwords
   - Auto Confirm: ✅ Yes

#### Option B: Use Supabase Admin API (Automated)

Create a script to create auth users using the Supabase Admin API:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key
)

// Create users
const users = [
  { email: 'admin1@school1.ly', password: 'Test123!', name: 'أحمد المحمدي' },
  // ... more users
]

for (const user of users) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
  })
  console.log(`Created user: ${user.email}`, data?.user?.id)
}
```

#### Option C: Modify Script to Create Auth Users (Advanced)

If you have service_role access, you can modify the seed script to create auth users directly:

```sql
-- This requires service_role key and proper permissions
-- Insert into auth.users (not recommended for production)
```

### Recommended Workflow

1. **First Run**: Run the seed script to create all data structures
2. **Extract User Emails**: Query the `users` table to get all emails
3. **Create Auth Users**: Use Supabase Dashboard or Admin API to create auth users
4. **Update UUIDs**: If needed, update the `users.id` to match `auth.users.id`

## 📝 Verification

After running the script, verify the data:

```sql
-- Count summary
SELECT 
    'Schools' as entity, COUNT(*) as count FROM schools
UNION ALL
SELECT 'Users', COUNT(*) FROM users
UNION ALL
SELECT 'Teachers', COUNT(*) FROM users WHERE role = 'teacher'
UNION ALL
SELECT 'Parents', COUNT(*) FROM users WHERE role = 'parent'
UNION ALL
SELECT 'Students', COUNT(*) FROM students
UNION ALL
SELECT 'Classes', COUNT(*) FROM classes
UNION ALL
SELECT 'Subjects', COUNT(*) FROM subjects
UNION ALL
SELECT 'Attendance Records', COUNT(*) FROM attendance
UNION ALL
SELECT 'Grades', COUNT(*) FROM grades
UNION ALL
SELECT 'Homework', COUNT(*) FROM homework;

-- School details
SELECT 
    s.name_ar as "اسم المدرسة",
    COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'teacher') as "عدد المعلمين",
    COUNT(DISTINCT st.id) as "عدد الطلاب",
    COUNT(DISTINCT c.id) as "عدد الفصول"
FROM schools s
LEFT JOIN users u ON u.school_id = s.id
LEFT JOIN students st ON st.school_id = s.id
LEFT JOIN classes c ON c.school_id = s.id
GROUP BY s.id, s.name_ar;
```

## 🎨 Customization

You can customize the script by modifying these variables at the top of the `DO $$` block:

```sql
school_count INTEGER := 5;              -- Number of schools
teachers_per_school INTEGER := 12;      -- Teachers per school
classes_per_school INTEGER := 8;        -- Classes per school
students_per_class INTEGER := 25;       -- Students per class
subjects_per_class INTEGER := 8;        -- Subjects per class
attendance_days INTEGER := 60;          -- Days of attendance records
grades_per_student INTEGER := 15;       -- Grades per student
homework_per_subject INTEGER := 5;      -- Homework per subject
notes_per_teacher INTEGER := 10;        -- Notes per teacher
announcements_per_school INTEGER := 8;  -- Announcements per school
```

## 🔄 Resetting Data

To start fresh:

```sql
-- WARNING: This will delete ALL data!
TRUNCATE TABLE 
    announcements,
    teacher_notes,
    homework,
    grades,
    attendance,
    subjects,
    students,
    classes,
    users,
    schools
CASCADE;
```

## 📧 Generated User Emails

The script generates emails in this pattern:
- Admins: `admin1@school1.ly`, `admin2@school2.ly`, etc.
- Teachers: `teacher1@school1.ly`, `teacher2@school1.ly`, etc.
- Parents: `parent1@school1.ly`, `parent2@school1.ly`, etc.

All users have Arabic names and are configured for the Arabic language preference.

## 🎯 Features

- ✅ All data in Arabic (names, subjects, feedback, etc.)
- ✅ Realistic date ranges (attendance, grades, homework)
- ✅ Proper relationships between entities
- ✅ Varied data (different exam types, attendance statuses, etc.)
- ✅ Libyan phone numbers and addresses
- ✅ Arabic exam names and feedback messages

## 🐛 Troubleshooting

### Error: "relation does not exist"
- Make sure you've run all migrations first
- Check that the schema is properly set up

### Error: "duplicate key value"
- The script uses `ON CONFLICT DO NOTHING` for users
- If you get conflicts, truncate tables and re-run

### Error: "foreign key constraint"
- Make sure parent records exist before child records
- The script handles this automatically, but check the order

### Auth users not working
- Remember: You must create auth users separately
- The UUIDs in `users` table must match `auth.users.id`

## 📚 Related Files

- `migrations/20240101_initial_schema.sql` - Database schema
- `TEST_DATA.sql` - Simple test data (smaller dataset)
- `TRIGGERS_AND_POLICIES.sql` - RLS policies and triggers

