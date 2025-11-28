# 🔗 Link Tilmeedhy-Live Project & Run Migrations

## Quick Setup (3 Steps)

### Step 1: Get Your Project Reference ID

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Open your **Tilmeedhy-Live** project
3. Go to **Settings** → **General**
4. Copy the **Reference ID** (looks like: `abcdefghijklmnop`)

---

### Step 2: Link the Project

```bash
cd /Users/macbookpro/My-School-platform/frontend
supabase link --project-ref YOUR_PROJECT_REF_ID
```

**Example:**
```bash
supabase link --project-ref abcdefghijklmnop
```

It will ask for your database password - enter the password you used when creating the Tilmeedhy-Live project.

---

### Step 3: Push All Migrations

Once linked, push all migrations at once:

```bash
supabase db push
```

This will:
- ✅ Run all migrations in the correct order automatically
- ✅ Skip migrations that are already applied
- ✅ Show progress for each migration
- ✅ Stop if there's an error (so you can fix it)

---

## Alternative: Run Migrations One by One

If you prefer to run them manually (to see progress):

```bash
cd /Users/macbookpro/My-School-platform/frontend

# Run migrations in order
supabase migration up 20240101_initial_schema
supabase migration up 20240102_row_level_security
supabase migration up 20240103_functions_and_triggers
# ... etc
```

---

## Verify Migrations Applied

Check which migrations have been applied:

```bash
supabase migration list
```

Or in Supabase Dashboard:
- Go to **Database** → **Migrations**
- You should see all applied migrations listed

---

## Troubleshooting

### Error: "project not linked"
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### Error: "not authenticated"
```bash
supabase login
```

### Error: "migration already exists"
This is normal! Supabase tracks applied migrations. Already-applied migrations will be skipped.

### Check project status
```bash
supabase status
```

---

**That's it!** 🚀 All migrations will run automatically in the correct order.

