# ⚡ Quick Migration Commands

## For Tilmeedhy-Live Project

### 1️⃣ Link Project (First Time Only)

```bash
cd /Users/macbookpro/My-School-platform/frontend
supabase link --project-ref YOUR_PROJECT_REF_ID
```
*(Get project ref from: Supabase Dashboard → Settings → General → Reference ID)*

---

### 2️⃣ Run All Migrations

```bash
supabase db push
```

This runs all migrations automatically in the correct order! ✅

---

### 3️⃣ Check Status

```bash
# See which migrations are applied
supabase migration list

# See project info
supabase status
```

---

## That's All You Need! 🚀

The `supabase db push` command handles everything:
- ✅ Runs migrations in order
- ✅ Skips already-applied migrations
- ✅ Shows progress
- ✅ Handles errors

---

## Need More Help?

- **Detailed guide:** `PRODUCTION_MIGRATIONS_CLI_GUIDE.md`
- **Migration checklist:** `PRODUCTION_MIGRATIONS_CHECKLIST.md`
- **Step-by-step setup:** `SETUP_TILMEEDHY_LIVE.md`

