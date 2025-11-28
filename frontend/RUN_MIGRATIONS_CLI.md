# 🚀 Run Production Migrations via CLI

## Quick Setup for Tilmeedhy-Live Project

### Step 1: Link Your Project

1. **Get your project reference ID:**
   - Go to Supabase Dashboard → **Tilmeedhy-Live** project
   - Go to **Settings** → **General**
   - Copy the **Reference ID** (looks like: `abcdefghijklmnop`)

2. **Link the project:**
   ```bash
   cd /Users/macbookpro/My-School-platform/frontend
   supabase link --project-ref YOUR_PROJECT_REF_ID
   ```
   
   It will ask for your database password - enter the same password you used when creating the project.

### Step 2: Run Migrations

#### Option A: Use the Automated Script (Recommended)

```bash
cd /Users/macbookpro/My-School-platform/frontend
chmod +x RUN_PRODUCTION_MIGRATIONS.sh
./RUN_PRODUCTION_MIGRATIONS.sh
```

#### Option B: Run Manually via Supabase CLI

**Push all migrations at once:**
```bash
cd /Users/macbookpro/My-School-platform/frontend
supabase db push
```

This will run all migrations in the `supabase/migrations/` folder in order.

#### Option C: Run Individual Migrations

```bash
cd /Users/macbookpro/My-School-platform/frontend

# Run a specific migration
supabase db push --file supabase/migrations/20240101_initial_schema.sql
```

### Step 3: Verify Migrations

After running migrations, verify in Supabase Dashboard:
1. Go to **Database** → **Migrations**
2. You should see all migrations listed
3. Check **Table Editor** to see all tables created

---

## Migration Order (Automatically Handled)

The migrations will run in this order:

1. ✅ `20240101_initial_schema.sql` - Creates all tables
2. ✅ `20240102_row_level_security.sql` - Enables RLS
3. ✅ `20240103_functions_and_triggers.sql` - Functions & notifications
4. ✅ `20240105_make_subjects_global.sql` - Global subjects
5. ✅ `20240106_fix_subjects_rls_global.sql` - Fix RLS for global subjects
6. ✅ `20241112_fix_notifications_rls.sql` - Fix notifications
7. ✅ `20241112_refine_rls_policies.sql` - Refine RLS
8. ✅ `20241119_teacher_subject_classes.sql` - Teacher assignments
9. ✅ `20241202_class_schedules.sql` - Class schedules
10. ✅ `20241203_teacher_grade_levels.sql` - Grade levels
11. ✅ `20241205_teacher_class_assignments.sql` - Class assignments
12. ✅ `20241206_core_data_indexes.sql` - Performance indexes
13. ✅ `20241206_audit_logs_indexes.sql` - Audit log indexes
14. ✅ `20241206_schedule_indexes.sql` - Schedule indexes
15. ✅ `20241206_rls_performance_patch.sql` - RLS performance
16. ✅ `20241206_school_overview_stats_enhanced.sql` - Statistics

---

## Troubleshooting

### Error: Project not linked

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### Error: Authentication required

```bash
supabase login
```

### Error: Migration already applied

If you get "migration already applied" errors, Supabase tracks applied migrations. You can:
- Skip already-applied migrations (they won't run again)
- Or reset and start fresh (⚠️ **WARNING**: This deletes all data)

### Check migration status

```bash
supabase migration list
```

---

## Alternative: Manual SQL Execution

If CLI doesn't work, you can still run migrations manually:

1. Go to Supabase Dashboard → **SQL Editor**
2. Copy each migration file content
3. Paste and run one at a time

See `PRODUCTION_MIGRATIONS_CHECKLIST.md` for the exact order.

---

**Ready to deploy!** 🚀

