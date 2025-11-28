# 🚀 Production Migrations via CLI - Quick Guide

## For Tilmeedhy-Live Project

### Prerequisites
- ✅ Supabase CLI installed (`supabase --version`)
- ✅ New Supabase project "Tilmeedhy-Live" created
- ✅ Database password (same as when creating project)

---

## Step 1: Link Your Project (One Time Setup)

```bash
cd /Users/macbookpro/My-School-platform/frontend
supabase link --project-ref YOUR_PROJECT_REF_ID
```

**To get your project reference ID:**
1. Go to Supabase Dashboard
2. Open **Tilmeedhy-Live** project  
3. Go to **Settings** → **General**
4. Copy the **Reference ID** (not the full URL)

**Example:**
```
supabase link --project-ref abcdefghijklmnop
```

Enter your database password when prompted.

---

## Step 2: Push All Migrations

Once linked, simply run:

```bash
supabase db push
```

This automatically:
- ✅ Runs all migrations in order
- ✅ Skips already-applied migrations
- ✅ Shows progress
- ✅ Handles errors gracefully

**Expected output:**
```
Pushing migrations...
  [1/16] Applying 20240101_initial_schema... ✅
  [2/16] Applying 20240102_row_level_security... ✅
  ...
```

---

## Recommended Migration Order

The `supabase db push` command will run them in order automatically. But here's what will run:

### Required (3 migrations):
1. `20240101_initial_schema.sql` ⚠️
2. `20240102_row_level_security.sql` ⚠️
3. `20240103_functions_and_triggers.sql` ⚠️

### Recommended (13 migrations):
4. `20240105_make_subjects_global.sql`
5. `20240106_fix_subjects_rls_global.sql`
6. `20241112_fix_notifications_rls.sql`
7. `20241112_refine_rls_policies.sql`
8. `20241119_teacher_subject_classes.sql`
9. `20241202_class_schedules.sql`
10. `20241203_teacher_grade_levels.sql`
11. `20241205_teacher_class_assignments.sql`
12. `20241206_core_data_indexes.sql`
13. `20241206_audit_logs_indexes.sql`
14. `20241206_schedule_indexes.sql`
15. `20241206_rls_performance_patch.sql`
16. `20241206_school_overview_stats_enhanced.sql`

**Total: 16 migrations (~20 minutes)**

---

## Verify Everything Worked

After migrations complete:

```bash
# Check migration status
supabase migration list

# Or check in dashboard
# Supabase Dashboard → Database → Migrations
```

---

## Quick Commands Reference

```bash
# Link project
supabase link --project-ref YOUR_REF

# Push all migrations
supabase db push

# Check migration status
supabase migration list

# Check project status
supabase status

# See diff (what would change)
supabase db diff
```

---

## Troubleshooting

### "Project not linked"
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### "Authentication required"
```bash
supabase login
```

### "Migration already exists"
✅ **This is normal!** Already-applied migrations are automatically skipped.

### View logs
```bash
supabase db push --debug
```

---

**Ready to go live!** 🎉

For detailed migration info, see: `PRODUCTION_MIGRATIONS_CHECKLIST.md`

