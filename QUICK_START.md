# 🚀 Tilmeedhy - Quick Start Guide

Get your school management platform running in **10 minutes**!

## Prerequisites ✅

- Node.js 20.9.0+ installed
- npm 10.0.0+ installed
- Supabase account ([Sign up free](https://supabase.com))

## Step 1: Install Dependencies (2 minutes)

```bash
cd My-School-platform/frontend
npm install
```

Wait for ~500 packages to install.

## Step 2: Setup Supabase (5 minutes)

### A. Create Project
1. Go to [supabase.com](https://supabase.com)
2. Click **"New Project"**
3. Name it: `tilmeedhy`
4. Choose region closest to you
5. Set database password (save it!)
6. Click **"Create"** and wait ~2 minutes

### B. Run Migrations
1. Open **SQL Editor** in Supabase dashboard
2. Run these files in order (copy/paste contents):
   - `frontend/supabase/migrations/20240101_initial_schema.sql`
   - `frontend/supabase/migrations/20240102_row_level_security.sql`
   - `frontend/supabase/migrations/20240103_functions_and_triggers.sql`

### C. Get API Keys
1. Go to **Settings** → **API**
2. Copy:
   - Project URL
   - anon public key
   - service_role key

### D. Enable Auth
1. Go to **Authentication** → **Providers**
2. Toggle **"Enable Email provider"** → Save

## Step 3: Configure Environment (1 minute)

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Tilmeedhy
NODE_ENV=development
```

Replace `xxxxx` and keys with your actual values!

## Step 4: Create Test Data (2 minutes)

### A. Create a School
In Supabase dashboard → **Table Editor** → **schools**:

Click **Insert row** and fill:
- name: `Test School`
- name_ar: `مدرسة تجريبية`
- subscription_status: `active`

Copy the generated `id` (you'll need it!)

### B. Create Test User
In Supabase dashboard → **Authentication** → **Users**:

Click **Add user** → **Create new user**:
- Email: `admin@test.com`
- Password: `test1234`
- Confirm: `test1234`

Click **Create user**

### C. Link User to School
**Table Editor** → **users** → **Insert row**:
- id: (paste the UUID from auth.users table)
- name: `Test Admin`
- role: `admin`
- email: `admin@test.com`
- school_id: (paste school id from step A)

## Step 5: Run the App! (30 seconds)

```bash
cd frontend
npm run dev
```

Open: [http://localhost:3000](http://localhost:3000)

## Step 6: Login and Test

1. Go to [http://localhost:3000/en/login](http://localhost:3000/en/login)
2. Login with:
   - Email: `admin@test.com`
   - Password: `test1234`
3. You should see the Admin Dashboard! 🎉

## ✨ Things to Try

1. **Switch Language**: Click globe icon → Choose العربية
2. **Dark Mode**: Click moon icon
3. **Responsive**: Resize browser window
4. **RTL**: Notice Arabic text flows right-to-left

## 🐛 Troubleshooting

**"Cannot connect to Supabase"**
- Check `.env.local` file exists
- Verify URLs and keys are correct

**"User not found"**
- Create user profile in `users` table
- Link `users.id` to `auth.users.id`

**"Permission denied"**
- Check RLS policies
- Verify `school_id` matches

**Port 3000 in use**
```bash
npx kill-port 3000
```

## 📖 Next Steps

✅ **Phase 1 Complete!** You now have:
- Working authentication
- 3 role-based dashboards
- Bilingual support (AR/EN)
- Dark mode
- Database ready

**Want to learn more?**
- Read `README.md` for overview
- Check `docs/SETUP.md` for details
- Review `PHASE1_COMPLETE.md` for everything we built

**Ready to build features?**
- Start with `project.md` to see what's planned
- Phase 2 focuses on Parent Features
- Database is ready, just add UI!

## 🎯 Create More Test Users

Create different role users to test all dashboards:

### Parent User
```sql
-- In Supabase Auth
Email: parent@test.com
Password: test1234

-- In users table
role: 'parent'
name: 'Test Parent'
school_id: [your-school-id]
```

### Teacher User
```sql
-- In Supabase Auth
Email: teacher@test.com
Password: test1234

-- In users table
role: 'teacher'
name: 'Test Teacher'
school_id: [your-school-id]
```

## 🎨 Customize

### Change Primary Color
Edit `frontend/app/globals.css`:
```css
:root {
  --primary: 240 5.9% 10%; /* Change these HSL values */
}
```

### Add Translation
Edit `frontend/messages/en.json` and `ar.json`

### Add Page
Create file in `frontend/app/[locale]/(role)/your-page/page.tsx`

## ⚡ Tips

- Use **Turbopack** (it's fast!)
- Server Components are default
- Add `"use client"` only when needed
- Use `npm run format` before committing

## 🚀 Production Deployment

**When ready for production:**

1. Push code to GitHub
2. Deploy frontend to [Vercel](https://vercel.com)
3. Use Supabase production project
4. Set environment variables in Vercel
5. Done! 🎉

---

**That's it! You're ready to build.** 🚀

For detailed information, see:
- `README.md` - Full documentation
- `docs/SETUP.md` - Detailed setup guide
- `PHASE1_COMPLETE.md` - What we built
- `project.md` - Complete specifications

**Happy coding!** 👨‍💻👩‍💻

