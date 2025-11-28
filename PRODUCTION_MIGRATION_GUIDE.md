# 🗄️ Production Database Migration Guide

## Overview

This guide lists **all migration scripts** that should be run on your production database, in the correct order.

**Total Migrations:** 21 files  
**Estimated Time:** 15-20 minutes

---

## 📋 Migration Execution Order

Run these migrations **in this exact order** using the Supabase SQL Editor.

### ✅ Core Foundation (MANDATORY - Run First)

These migrations create the database structure and security policies. **All three must be run.**

#### 1. **20240101_initial_schema.sql** ✅ REQUIRED
**Purpose:** Creates all database tables, types, and basic indexes  
**Creates:**
- All ENUM types (user_role, gender_type, attendance_status, etc.)
- All core tables (schools, users, students, classes, subjects, grades, attendance, homework, teacher_notes, announcements, notifications, audit_logs)
- Basic indexes for performance
- Foreign key relationships

**Run Time:** ~2-3 minutes  
**Critical:** ⚠️ **MUST RUN FIRST**

---

#### 2. **20240102_row_level_security.sql** ✅ REQUIRED
**Purpose:** Enables Row Level Security (RLS) and creates helper functions  
**Creates:**
- Enables RLS on all tables
- Helper functions: `auth.user_role()`, `auth.user_school_id()`, `auth.is_admin()`, etc.
- Basic RLS policies for data isolation

**Run Time:** ~1-2 minutes  
**Critical:** ⚠️ **REQUIRED** - Data security depends on this

---

#### 3. **20240103_functions_and_triggers.sql** ✅ REQUIRED
**Purpose:** Creates database functions and triggers for notifications  
**Creates:**
- Automatic notification triggers (homework, grades, attendance, notes, announcements)
- Utility functions for statistics
- Audit logging functions

**Run Time:** ~2-3 minutes  
**Critical:** ⚠️ **REQUIRED** - Notifications won't work without this

---

### 🔧 Core Feature Enhancements (IMPORTANT)

#### 4. **20240104_make_subjects_school_wide.sql** ⚠️ CHECK IF NEEDED
**Purpose:** Makes subjects school-specific  
**Status:** May be superseded by migration #5  
**Check:** Only run if you want school-specific subjects (not recommended if using global subjects)

---

#### 5. **20240105_make_subjects_global.sql** ✅ RECOMMENDED
**Purpose:** Makes subjects global (can be shared across schools)  
**Changes:**
- Makes `school_id` nullable in subjects table
- Allows global subjects that all schools can use
- Updates unique constraints

**Run Time:** ~30 seconds  
**Recommendation:** ✅ **RUN THIS** - Better for multi-school platform

---

#### 6. **20240106_fix_subjects_rls_global.sql** ✅ REQUIRED (if using global subjects)
**Purpose:** Fixes RLS policies for global subjects  
**Status:** Required if you ran migration #5  
**Changes:**
- Updates RLS policies to allow viewing global subjects
- Fixes helper functions for subject access

**Run Time:** ~1 minute  
**Recommendation:** ✅ **RUN THIS** (especially if you ran #5)

---

#### 7. **20241112_fix_notifications_rls.sql** ✅ RECOMMENDED
**Purpose:** Fixes RLS policies for notifications  
**Changes:**
- Improves notification access policies
- Fixes user notification queries

**Run Time:** ~30 seconds  
**Recommendation:** ✅ **RUN THIS**

---

#### 8. **20241112_refine_rls_policies.sql** ✅ RECOMMENDED
**Purpose:** Refines and improves RLS policies across all tables  
**Changes:**
- Updates RLS policies for better security
- Improves helper functions
- Better data isolation

**Run Time:** ~2 minutes  
**Recommendation:** ✅ **RUN THIS** - Improves security

---

### 👥 User Role Enhancements

#### 9. **20241119_allow_super_admin_view_all_schools.sql** ⚠️ OPTIONAL
**Purpose:** Allows super admin to view all schools  
**Status:** Only needed if you have a super admin role  
**Check:** Review if you need multi-school platform admin access

---

#### 10. **20241201_add_hr_role.sql** ⚠️ OPTIONAL
**Purpose:** Adds 'hr' role to user_role enum  
**Status:** Part 1 of 2 - Only adds the enum value  
**Run Time:** ~10 seconds  
**Recommendation:** Only run if you need HR role

---

#### 11. **20241201_add_hr_role_part2.sql** ⚠️ OPTIONAL
**Purpose:** Adds HR role policies and functions  
**Status:** Part 2 of 2 - Requires migration #10  
**Run Time:** ~1 minute  
**Recommendation:** Only run if you ran migration #10

---

### 📚 Teacher Features

#### 12. **20241119_teacher_subject_classes.sql** ✅ RECOMMENDED
**Purpose:** Creates junction table for teacher-subject-class assignments  
**Creates:**
- `teacher_subject_classes` table
- Relationships for teacher assignments
- Better teacher management

**Run Time:** ~1 minute  
**Recommendation:** ✅ **RUN THIS** - Better teacher management

---

#### 13. **20241202_class_schedules.sql** ✅ RECOMMENDED
**Purpose:** Adds class schedules and periods functionality  
**Creates:**
- Class periods table
- Schedule management
- Period assignments

**Run Time:** ~2 minutes  
**Recommendation:** ✅ **RUN THIS** - If you use class schedules

---

#### 14. **20241203_teacher_grade_levels.sql** ✅ RECOMMENDED
**Purpose:** Adds teacher grade level preferences  
**Creates:**
- Teacher grade level assignments
- Grade level preferences

**Run Time:** ~1 minute  
**Recommendation:** ✅ **RUN THIS** - Better teacher assignment

---

#### 15. **20241205_teacher_class_assignments.sql** ✅ RECOMMENDED
**Purpose:** Improves teacher class assignment system  
**Changes:**
- Better assignment management
- Improved relationships

**Run Time:** ~1 minute  
**Recommendation:** ✅ **RUN THIS**

---

### ⚡ Performance Optimizations (HIGHLY RECOMMENDED)

These migrations add indexes for better performance. **Run all of them for optimal performance.**

#### 16. **20241206_core_data_indexes.sql** ✅ HIGHLY RECOMMENDED
**Purpose:** Adds indexes for students, attendance, and grades queries  
**Creates:**
- Indexes on students (school_id, created_at, enrollment_date)
- Indexes on attendance (school_id, date, student_id)
- Indexes on grades (school_id, student_id, date, subject_id)

**Run Time:** ~1 minute  
**Recommendation:** ✅✅ **STRONGLY RECOMMENDED** - Significantly improves query speed

---

#### 17. **20241206_audit_logs_indexes.sql** ✅ HIGHLY RECOMMENDED
**Purpose:** Optimizes audit logs queries for dashboard  
**Creates:**
- Indexes on audit_logs table
- Faster dashboard loading

**Run Time:** ~30 seconds  
**Recommendation:** ✅✅ **STRONGLY RECOMMENDED** - Improves dashboard performance

---

#### 18. **20241206_schedule_indexes.sql** ✅ RECOMMENDED (if using schedules)
**Purpose:** Optimizes schedule-related queries  
**Creates:**
- Indexes on schedule tables
- Faster schedule queries

**Run Time:** ~30 seconds  
**Recommendation:** ✅ **RUN THIS** if you use class schedules (migration #13)

---

#### 19. **20241206_rls_performance_patch.sql** ✅ HIGHLY RECOMMENDED
**Purpose:** Performance improvements for RLS policies  
**Changes:**
- Optimizes RLS policy execution
- Improves query performance with RLS enabled

**Run Time:** ~1 minute  
**Recommendation:** ✅✅ **STRONGLY RECOMMENDED** - Better overall performance

---

### 📊 Analytics Features

#### 20. **20241206_school_overview_stats.sql** ⚠️ OPTIONAL
**Purpose:** Creates function for school overview statistics  
**Creates:**
- Statistics function for dashboard
- Analytics helpers

**Run Time:** ~1 minute  
**Recommendation:** Optional - may be superseded by #21

---

#### 21. **20241206_school_overview_stats_enhanced.sql** ✅ RECOMMENDED (if using stats)
**Purpose:** Enhanced school overview statistics function  
**Status:** Enhanced version - may supersede #20  
**Run Time:** ~1 minute  
**Recommendation:** ✅ **RUN THIS** if you need dashboard statistics (better than #20)

---

## 🚀 Quick Production Migration Checklist

### Step 1: Core Foundation (MANDATORY)
- [ ] `20240101_initial_schema.sql` ⚠️ REQUIRED
- [ ] `20240102_row_level_security.sql` ⚠️ REQUIRED
- [ ] `20240103_functions_and_triggers.sql` ⚠️ REQUIRED

### Step 2: Core Features (RECOMMENDED)
- [ ] `20240105_make_subjects_global.sql` ✅ Recommended
- [ ] `20240106_fix_subjects_rls_global.sql` ✅ Required if using global subjects
- [ ] `20241112_fix_notifications_rls.sql` ✅ Recommended
- [ ] `20241112_refine_rls_policies.sql` ✅ Recommended

### Step 3: Teacher Features (RECOMMENDED)
- [ ] `20241119_teacher_subject_classes.sql` ✅ Recommended
- [ ] `20241202_class_schedules.sql` ✅ Recommended
- [ ] `20241203_teacher_grade_levels.sql` ✅ Recommended
- [ ] `20241205_teacher_class_assignments.sql` ✅ Recommended

### Step 4: Performance (HIGHLY RECOMMENDED)
- [ ] `20241206_core_data_indexes.sql` ✅✅ Strongly Recommended
- [ ] `20241206_audit_logs_indexes.sql` ✅✅ Strongly Recommended
- [ ] `20241206_schedule_indexes.sql` ✅ Recommended (if using schedules)
- [ ] `20241206_rls_performance_patch.sql` ✅✅ Strongly Recommended

### Step 5: Analytics (OPTIONAL)
- [ ] `20241206_school_overview_stats_enhanced.sql` ✅ Optional

### Step 6: Optional Features
- [ ] `20241119_allow_super_admin_view_all_schools.sql` ⚠️ Only if needed
- [ ] `20241201_add_hr_role.sql` ⚠️ Only if using HR role
- [ ] `20241201_add_hr_role_part2.sql` ⚠️ Only if using HR role

---

## 📝 Recommended Production Migration Order

For a **standard production deployment**, run these migrations in order:

```
1.  20240101_initial_schema.sql                    ⚠️ REQUIRED
2.  20240102_row_level_security.sql                ⚠️ REQUIRED
3.  20240103_functions_and_triggers.sql            ⚠️ REQUIRED
4.  20240105_make_subjects_global.sql              ✅ Recommended
5.  20240106_fix_subjects_rls_global.sql           ✅ Recommended
6.  20241112_fix_notifications_rls.sql             ✅ Recommended
7.  20241112_refine_rls_policies.sql               ✅ Recommended
8.  20241119_teacher_subject_classes.sql           ✅ Recommended
9.  20241202_class_schedules.sql                   ✅ Recommended
10. 20241203_teacher_grade_levels.sql              ✅ Recommended
11. 20241205_teacher_class_assignments.sql         ✅ Recommended
12. 20241206_core_data_indexes.sql                 ✅✅ Strongly Recommended
13. 20241206_audit_logs_indexes.sql                ✅✅ Strongly Recommended
14. 20241206_schedule_indexes.sql                  ✅ Recommended
15. 20241206_rls_performance_patch.sql             ✅✅ Strongly Recommended
16. 20241206_school_overview_stats_enhanced.sql    ✅ Optional
```

**Total: 16 migrations for standard production setup**

---

## 🎯 Minimal Production Setup (Absolute Minimum)

If you need the **absolute minimum** for production:

```
1.  20240101_initial_schema.sql                    ⚠️ REQUIRED
2.  20240102_row_level_security.sql                ⚠️ REQUIRED
3.  20240103_functions_and_triggers.sql            ⚠️ REQUIRED
4.  20241206_core_data_indexes.sql                 ✅✅ Strongly Recommended
5.  20241206_audit_logs_indexes.sql                ✅✅ Strongly Recommended
6.  20241206_rls_performance_patch.sql             ✅✅ Strongly Recommended
```

**Total: 6 migrations (3 required + 3 performance)**

⚠️ **Warning:** Minimal setup may miss important features and security improvements.

---

## 📋 How to Run Migrations

### Option 1: Supabase SQL Editor (Recommended)

1. Go to your Supabase Dashboard → **SQL Editor**
2. Click **"New Query"**
3. Open each migration file from `frontend/supabase/migrations/`
4. Copy the entire contents
5. Paste into SQL Editor
6. Click **"Run"**
7. Wait for completion
8. Repeat for next migration

### Option 2: Using Migration Script (Advanced)

```bash
cd frontend/supabase
node scripts/run-migration.js migrations/20240101_initial_schema.sql [DATABASE_PASSWORD]
```

---

## ✅ Verification After Migrations

After running all migrations, verify:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check indexes exist
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY indexname;
```

---

## ⚠️ Important Notes

1. **Order Matters:** Run migrations in the exact order listed
2. **Don't Skip:** Don't skip required migrations
3. **Backup First:** Always backup your database before running migrations
4. **Test First:** Test migrations on a development/staging database first
5. **Check Dependencies:** Some migrations depend on others
6. **Performance Migrations:** Highly recommended but not required for functionality

---

## 🔍 Migration Details Summary

| Migration | Type | Required | Time | Impact |
|-----------|------|----------|------|--------|
| 20240101_initial_schema.sql | Foundation | ✅ YES | ~3 min | Creates all tables |
| 20240102_row_level_security.sql | Security | ✅ YES | ~2 min | Enables RLS |
| 20240103_functions_and_triggers.sql | Features | ✅ YES | ~3 min | Notifications |
| 20240105_make_subjects_global.sql | Feature | ⚠️ Recommended | ~30s | Global subjects |
| 20240106_fix_subjects_rls_global.sql | Security | ⚠️ If #5 used | ~1 min | Fixes RLS |
| 20241112_fix_notifications_rls.sql | Security | ⚠️ Recommended | ~30s | Fixes notifications |
| 20241112_refine_rls_policies.sql | Security | ⚠️ Recommended | ~2 min | Better security |
| 20241119_teacher_subject_classes.sql | Feature | ⚠️ Recommended | ~1 min | Teacher features |
| 20241202_class_schedules.sql | Feature | ⚠️ Recommended | ~2 min | Schedules |
| 20241203_teacher_grade_levels.sql | Feature | ⚠️ Recommended | ~1 min | Grade levels |
| 20241205_teacher_class_assignments.sql | Feature | ⚠️ Recommended | ~1 min | Assignments |
| 20241206_core_data_indexes.sql | Performance | ✅✅ Strongly | ~1 min | Query speed |
| 20241206_audit_logs_indexes.sql | Performance | ✅✅ Strongly | ~30s | Dashboard speed |
| 20241206_schedule_indexes.sql | Performance | ⚠️ If schedules | ~30s | Schedule speed |
| 20241206_rls_performance_patch.sql | Performance | ✅✅ Strongly | ~1 min | Overall speed |
| 20241206_school_overview_stats_enhanced.sql | Analytics | ⚠️ Optional | ~1 min | Statistics |

---

## 📞 Need Help?

If you encounter issues:
1. Check migration error messages
2. Verify previous migrations completed successfully
3. Check Supabase logs
4. Review migration file comments

---

**Last Updated:** December 2024  
**Total Migrations:** 21  
**Recommended for Production:** 16  
**Minimum Required:** 3

