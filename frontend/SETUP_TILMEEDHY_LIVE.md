# 🔗 Setup Tilmeedhy-Live Project - Step by Step

## Quick Setup Guide

### Step 1: Get Your Project Reference ID

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click on your **Tilmeedhy-Live** project
3. Go to **Settings** (gear icon in sidebar)
4. Click **General**
5. Find **Reference ID** (it's a short string like `abcdefghijklmnop`)
6. **Copy it** - you'll need it in the next step

---

### Step 2: Link Your Project

Run this command (replace `YOUR_PROJECT_REF` with the Reference ID you copied):

```bash
cd /Users/macbookpro/My-School-platform/frontend
supabase link --project-ref YOUR_PROJECT_REF
```

**It will ask for:**
- Database password: Enter the password you used when creating the Tilmeedhy-Live project

**Example:**
```bash
supabase link --project-ref abcdefghijklmnop
```

---

### Step 3: Push All Migrations

Once linked, push all migrations:

```bash
supabase db push
```

This will:
- ✅ Run all 16 migrations in the correct order
- ✅ Show progress for each one
- ✅ Skip migrations already applied
- ✅ Stop if there's an error

**Expected time:** ~20 minutes

---

### Step 4: Verify

Check that migrations were applied:

```bash
supabase migration list
```

Or check in Supabase Dashboard:
- Go to **Database** → **Migrations**
- You should see all 16 migrations listed

---

## That's It! 🎉

Your production database is now set up with all migrations applied.

---

## Troubleshooting

### "Project not linked"
Make sure you ran Step 2 (`supabase link`)

### "Authentication required"
```bash
supabase login
```

### "Migration already exists"
✅ This is normal - already-applied migrations are skipped automatically.

### Need help?
See: `PRODUCTION_MIGRATIONS_CLI_GUIDE.md` for more details

