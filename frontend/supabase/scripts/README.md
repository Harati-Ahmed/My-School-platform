# Seed Scripts

## Workflow

1. **Create Auth Users First** (REQUIRED)
   ```bash
   node supabase/scripts/create-all-auth-users.js
   ```
   - Creates all auth users needed for seed data
   - Takes 5-10 minutes (creates ~1,000+ users)
   - Safe to run multiple times (skips existing users)

2. **Run Seed Script**
   - Via SQL Editor: Copy/paste `seed_arabic_data.sql`
   - The seed script looks up auth users by email and creates user profiles

## Scripts

### `create-all-auth-users.js`
Creates all auth users with predictable emails that the seed script expects.

**What it creates:**
- 5 admins (admin1@school1.ly, etc.)
- 60 teachers (12 per school)
- 1,000+ parents (200+ per school)

**Features:**
- Checks for existing users first (fast)
- Handles pagination for large user lists
- Skips existing users automatically
- Shows progress summary

### `create-auth-users.js` (Legacy)
Creates auth users from existing user profiles in the database. Use `create-all-auth-users.js` instead.

### `run-seed.js` (Helper)
Helper script that shows instructions. Not needed - just use SQL Editor directly.

