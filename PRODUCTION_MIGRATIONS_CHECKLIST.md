# ✅ Production Database Migrations Checklist

## 🚀 Quick Reference: Run These Migrations in Order

### Step 1: Core Foundation (MANDATORY - Start Here)

Run these **3 migrations first** - they create the entire database structure:

```
✅ 1. 20240101_initial_schema.sql
✅ 2. 20240102_row_level_security.sql
✅ 3. 20240103_functions_and_triggers.sql
```

**Time:** ~7-8 minutes total  
**Status:** ⚠️ **MUST RUN** - Database won't work without these

---

### Step 2: Core Features (RECOMMENDED)

Run these to enable important features:

```
✅ 4. 20240105_make_subjects_global.sql
✅ 5. 20240106_fix_subjects_rls_global.sql
✅ 6. 20241112_fix_notifications_rls.sql
✅ 7. 20241112_refine_rls_policies.sql
```

**Time:** ~4-5 minutes total  
**Status:** ✅ **HIGHLY RECOMMENDED**

---

### Step 3: Teacher Features (RECOMMENDED)

Run these for complete teacher functionality:

```
✅ 8. 20241119_teacher_subject_classes.sql
✅ 9. 20241202_class_schedules.sql
✅ 10. 20241203_teacher_grade_levels.sql
✅ 11. 20241205_teacher_class_assignments.sql
```

**Time:** ~5-6 minutes total  
**Status:** ✅ **RECOMMENDED** - Better teacher management

---

### Step 4: Performance Optimizations (STRONGLY RECOMMENDED)

Run these to improve query performance - **very important for production**:

```
✅✅ 12. 20241206_core_data_indexes.sql
✅✅ 13. 20241206_audit_logs_indexes.sql
✅✅ 14. 20241206_schedule_indexes.sql (if using schedules)
✅✅ 15. 20241206_rls_performance_patch.sql
```

**Time:** ~3-4 minutes total  
**Status:** ✅✅ **STRONGLY RECOMMENDED** - Significantly improves speed

---

### Step 5: Analytics (OPTIONAL)

```
✅ 16. 20241206_school_overview_stats_enhanced.sql
```

**Time:** ~1 minute  
**Status:** ⚠️ **OPTIONAL** - Only if you need dashboard statistics

---

## 📝 Complete Production Checklist

Copy this checklist and check off each migration as you run it:

### Core Foundation
- [ ] `20240101_initial_schema.sql` ⚠️ REQUIRED
- [ ] `20240102_row_level_security.sql` ⚠️ REQUIRED
- [ ] `20240103_functions_and_triggers.sql` ⚠️ REQUIRED

### Core Features
- [ ] `20240105_make_subjects_global.sql` ✅ Recommended
- [ ] `20240106_fix_subjects_rls_global.sql` ✅ Recommended
- [ ] `20241112_fix_notifications_rls.sql` ✅ Recommended
- [ ] `20241112_refine_rls_policies.sql` ✅ Recommended

### Teacher Features
- [ ] `20241119_teacher_subject_classes.sql` ✅ Recommended
- [ ] `20241202_class_schedules.sql` ✅ Recommended
- [ ] `20241203_teacher_grade_levels.sql` ✅ Recommended
- [ ] `20241205_teacher_class_assignments.sql` ✅ Recommended

### Performance
- [ ] `20241206_core_data_indexes.sql` ✅✅ Strongly Recommended
- [ ] `20241206_audit_logs_indexes.sql` ✅✅ Strongly Recommended
- [ ] `20241206_schedule_indexes.sql` ✅ Recommended (if using schedules)
- [ ] `20241206_rls_performance_patch.sql` ✅✅ Strongly Recommended

### Analytics
- [ ] `20241206_school_overview_stats_enhanced.sql` ⚠️ Optional

---

## 🎯 Recommended Production Setup (16 migrations)

This is the **recommended configuration** for production:

```
1.  20240101_initial_schema.sql
2.  20240102_row_level_security.sql
3.  20240103_functions_and_triggers.sql
4.  20240105_make_subjects_global.sql
5.  20240106_fix_subjects_rls_global.sql
6.  20241112_fix_notifications_rls.sql
7.  20241112_refine_rls_policies.sql
8.  20241119_teacher_subject_classes.sql
9.  20241202_class_schedules.sql
10. 20241203_teacher_grade_levels.sql
11. 20241205_teacher_class_assignments.sql
12. 20241206_core_data_indexes.sql
13. 20241206_audit_logs_indexes.sql
14. 20241206_schedule_indexes.sql
15. 20241206_rls_performance_patch.sql
16. 20241206_school_overview_stats_enhanced.sql
```

**Total Time:** ~20 minutes  
**Total Migrations:** 16

---

## ⚡ Minimal Setup (6 migrations)

If you need the **absolute minimum** (not recommended):

```
1.  20240101_initial_schema.sql        ⚠️ REQUIRED
2.  20240102_row_level_security.sql    ⚠️ REQUIRED
3.  20240103_functions_and_triggers.sql ⚠️ REQUIRED
4.  20241206_core_data_indexes.sql     ✅✅ Performance
5.  20241206_audit_logs_indexes.sql    ✅✅ Performance
6.  20241206_rls_performance_patch.sql ✅✅ Performance
```

**Total Time:** ~10 minutes  
**Total Migrations:** 6

⚠️ **Warning:** You'll miss important features with minimal setup.

---

## 📋 How to Run

### Using Supabase SQL Editor:

1. Open Supabase Dashboard → **SQL Editor**
2. Click **"New Query"**
3. Navigate to: `frontend/supabase/migrations/[migration-file].sql`
4. Copy entire file contents
5. Paste into SQL Editor
6. Click **"Run"**
7. Wait for success message
8. Move to next migration

**Tip:** Run one migration at a time and verify success before proceeding.

---

## ✅ Verification Commands

After running all migrations, verify everything works:

```sql
-- Check all tables exist (should show 12+ tables)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verify RLS is enabled on all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check indexes were created (should show many indexes)
SELECT COUNT(*) as total_indexes
FROM pg_indexes 
WHERE schemaname = 'public';
```

---

## ⚠️ Important Notes

1. **Run in Order:** Migrations must run in the exact order listed
2. **Don't Skip:** Don't skip required migrations
3. **Backup First:** Always backup database before migrations
4. **Test First:** Test on staging/dev database first
5. **One at a Time:** Run one migration, verify success, then next

---

## 🚨 Migrations NOT Needed for Production

These migrations are **optional** or **superseded**:

- ❌ `20240104_make_subjects_school_wide.sql` - Superseded by #5
- ⚠️ `20241119_allow_super_admin_view_all_schools.sql` - Only if you have super admin
- ⚠️ `20241201_add_hr_role.sql` - Only if you need HR role
- ⚠️ `20241201_add_hr_role_part2.sql` - Only if you need HR role
- ⚠️ `20241206_school_overview_stats.sql` - Superseded by enhanced version

---

**Ready to deploy!** 🚀

For detailed information about each migration, see: `PRODUCTION_MIGRATION_GUIDE.md`

