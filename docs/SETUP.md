# 🔧 Tilmeedhy Setup Guide

Complete step-by-step guide to set up the Tilmeedhy school management platform.

## Prerequisites Checklist

- [ ] Node.js 20.9.0 or higher installed
- [ ] npm 10.0.0 or higher installed
- [ ] Git installed
- [ ] Code editor (VS Code recommended)
- [ ] Supabase account created

## Step 1: Environment Setup

### Verify Node.js and npm

```bash
node --version  # Should be >= v20.9.0
npm --version   # Should be >= 10.0.0
```

If you need to upgrade:
- **Node.js**: Download from [nodejs.org](https://nodejs.org)
- **npm**: Run `npm install -g npm@latest`

## Step 2: Project Installation

### Clone and Install

```bash
# Navigate to project
cd My-School-platform/frontend

# Install dependencies
npm install
```

This will install all required packages (~500 packages, takes 1-2 minutes).

## Step 3: Supabase Project Setup

### Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click **"New Project"**
4. Fill in project details:
   - **Name**: tilmeedhy (or your school name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to Libya (e.g., EU West or Middle East)
   - **Pricing Plan**: Free tier is fine for development
5. Click **"Create new project"**
6. Wait 2-3 minutes for setup to complete

### Get API Keys

1. In your Supabase dashboard, go to **Settings** → **API**
2. You'll see three important values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: Long string starting with `eyJ...`
   - **service_role key**: Another long string (keep this SECRET!)

### Run Database Migrations

1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Copy content from `frontend/supabase/migrations/20240101_initial_schema.sql`
4. Paste and click **"Run"**
5. Repeat for:
   - `20240102_row_level_security.sql`
   - `20240103_functions_and_triggers.sql`

**Alternative**: Use Supabase CLI (advanced)
```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run all migrations
supabase db push
```

### Enable Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider:
   - Toggle "Enable Email provider"
   - Set "Confirm email" to OFF (for development)
   - Click "Save"
3. (Optional) Enable **Phone** provider:
   - Toggle "Enable Phone provider"
   - Configure SMS provider (Twilio recommended)
   - Click "Save"

### Configure Email Templates

1. Go to **Authentication** → **Email Templates**
2. Customize templates for:
   - Confirm signup
   - Invite user
   - Magic Link
   - Change Email Address
   - Reset Password

## Step 4: Environment Configuration

### Create .env.local File

In the `frontend` directory, create `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...your-service-role-key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Tilmeedhy

# Node Environment
NODE_ENV=development
```

**⚠️ Important Security Notes:**
- Never commit `.env.local` to Git (it's in .gitignore)
- Never share your `SUPABASE_SERVICE_ROLE_KEY`
- Use different keys for development and production

## Step 5: Test the Setup

### Run Development Server

```bash
cd frontend
npm run dev
```

You should see:
```
▲ Next.js 16.0.1
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000
```

### Verify Everything Works

1. Open browser to [http://localhost:3000](http://localhost:3000)
2. You should see the homepage
3. Language should auto-detect (or default to Arabic)
4. Click "Login" to see the login page

### Create Test Users in Supabase

1. Go to Supabase dashboard → **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Create test accounts:

**Admin User:**
```
Email: admin@test.com
Password: test1234
```

**Teacher User:**
```
Email: teacher@test.com
Password: test1234
```

**Parent User:**
```
Email: parent@test.com
Password: test1234
```

4. After creating users, add their profiles to the `users` table:

Go to **Table Editor** → **users** table → **Insert row**:

```sql
-- For admin
INSERT INTO users (id, name, role, email, school_id)
VALUES (
  'auth-user-id-from-auth-users-table',
  'Test Admin',
  'admin',
  'admin@test.com',
  'school-id-from-schools-table'
);
```

**Note**: You need to create a school first in the `schools` table!

### Create Test School

Go to **Table Editor** → **schools** table → **Insert row**:

```
name: Test School
name_ar: مدرسة تجريبية
subscription_status: active
```

Copy the generated `id` and use it when creating user profiles.

## Step 6: Verify Authentication

1. Go to [http://localhost:3000/en/login](http://localhost:3000/en/login)
2. Try logging in with `admin@test.com` / `test1234`
3. You should be redirected to `/en/dashboard`

If login fails:
- Check browser console for errors
- Check Supabase logs: Dashboard → **Logs** → **Auth**
- Verify user exists in both `auth.users` and `public.users` tables

## Common Issues & Solutions

### "Cannot connect to Supabase"

**Solution:**
- Check your `.env.local` file
- Verify NEXT_PUBLIC_SUPABASE_URL is correct
- Ensure you're using the anon key (not service role key) for public access

### "User not found" after login

**Solution:**
- User exists in `auth.users` but not in `public.users`
- Manually create user profile in `users` table
- Link `users.id` to `auth.users.id`

### "Permission denied" errors

**Solution:**
- RLS policies might be too restrictive
- Check `school_id` matches between users and their school
- Temporarily disable RLS for testing:
  ```sql
  ALTER TABLE users DISABLE ROW LEVEL SECURITY;
  ```
  (Re-enable after testing!)

### Port 3000 already in use

**Solution:**
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

### TypeScript errors

**Solution:**
```bash
# Regenerate TypeScript types from Supabase
npx supabase gen types typescript --project-id your-project-ref > frontend/types/database.ts
```

## Step 7: Development Workflow

### Daily Development

```bash
# Start dev server
npm run dev

# In another terminal, watch for type errors
npm run type-check -- --watch

# Format code before committing
npm run format
```

### Before Committing

```bash
npm run lint        # Check for lint errors
npm run type-check  # Check TypeScript
npm run format      # Format code
```

## Step 8: Optional - Install Supabase CLI

For advanced database management:

```bash
# Install globally
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Useful commands
supabase db diff        # See schema changes
supabase db reset       # Reset local database
supabase db push        # Push migrations
supabase gen types typescript --local > types/database.ts
```

## Next Steps

Now that setup is complete, you can:

1. **Explore the codebase**: Start with `app/[locale]/page.tsx`
2. **Create more test data**: Add classes, students, subjects
3. **Start Phase 2 development**: Parent features
4. **Read project.md**: Full project specifications

## Need Help?

- Check `README.md` for general information
- Read `project.md` for detailed specifications
- Check Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
- Check Next.js 16 documentation: [nextjs.org/docs](https://nextjs.org/docs)

## Setup Verification Checklist

- [ ] Node.js and npm correct versions
- [ ] Dependencies installed successfully
- [ ] Supabase project created
- [ ] Database migrations run successfully
- [ ] Environment variables configured
- [ ] Authentication enabled
- [ ] Test school created
- [ ] Test users created
- [ ] Dev server runs without errors
- [ ] Can access homepage
- [ ] Can access login page
- [ ] Can login successfully
- [ ] Redirects to dashboard after login

If all checkboxes are checked, you're ready to start development! 🎉

