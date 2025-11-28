# Development Files - DO NOT DEPLOY

⚠️ **These files are for development and testing only. They should NOT be included in production deployments.**

## Test/Seed Data Files

- `TEST_DATA.sql` - Simple test data for initial setup
- `seed_arabic_data.sql` - Comprehensive Arabic test data (large dataset)
- `SEED_README.md` - Documentation for seed data
- `QUICK_SEED_GUIDE.md` - Quick start guide for seed data

## Development Scripts

All files in `supabase/scripts/` are development tools:
- `create-all-auth-users.js` - Creates auth users for seed data
- `cleanup-all-data.js` - Cleans up test data
- `verify-*.js` - Verification scripts
- `run-seed-*.js` - Seed execution scripts

## Production Deployment

When deploying to production:
1. ✅ **DO** deploy: All migration files in `migrations/`
2. ❌ **DON'T** deploy: Test/seed data files
3. ❌ **DON'T** deploy: Development scripts
4. ✅ **DO** deploy: Production code only

These files are excluded from production builds via `.gitignore` and won't be included in Vercel deployments.

