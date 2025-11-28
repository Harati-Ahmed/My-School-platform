# 🚀 GitHub & Vercel Setup Guide

This guide will help you push your code to GitHub and deploy to Vercel.

## Step 1: Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the **"+"** icon in the top right corner
3. Select **"New repository"**
4. Fill in the details:
   - **Repository name**: `My-School-platform` (or your preferred name)
   - **Description**: "Tilmeedhy - School Management Platform"
   - **Visibility**: Choose **Public** or **Private**
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click **"Create repository"**

## Step 2: Push Code to GitHub

After creating the repository, GitHub will show you commands. Use these commands in your terminal:

```bash
# Navigate to your project directory
cd /Users/macbookpro/My-School-platform

# Add the remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/My-School-platform.git

# Rename branch to main if needed (should already be main)
git branch -M main

# Push your code to GitHub
git push -u origin main
```

**Note**: If you're using SSH instead of HTTPS:
```bash
git remote add origin git@github.com:YOUR_USERNAME/My-School-platform.git
```

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. Go to [Vercel.com](https://vercel.com) and sign in (use GitHub to sign in for easier integration)

2. Click **"Add New Project"**

3. Import your GitHub repository:
   - Select your repository: `My-School-platform`
   - Click **"Import"**

4. Configure Project Settings:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `frontend` ⚠️ **IMPORTANT**: Set this to `frontend`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

5. Add Environment Variables:
   Click **"Environment Variables"** and add:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NODE_ENV=production
   ```

6. Click **"Deploy"**

7. Wait for deployment to complete (usually 2-5 minutes)

8. Your site will be live at: `https://your-project-name.vercel.app`

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Navigate to frontend directory
cd frontend

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - Project name? (press Enter for default)
# - Directory? ./frontend
# - Override settings? No

# For production deployment:
vercel --prod
```

## Step 4: Configure Custom Domain (Optional)

1. In Vercel Dashboard, go to your project
2. Click **"Settings"** → **"Domains"**
3. Add your custom domain (e.g., `tilmeedhy.ly`)
4. Follow DNS configuration instructions
5. SSL certificate will be automatically provisioned

## Step 5: Set Up Automatic Deployments

Vercel automatically deploys when you push to GitHub:

- **Production**: Deploys from `main` branch
- **Preview**: Deploys from other branches and pull requests

## Environment Variables Reference

Make sure to add these in Vercel Dashboard → Settings → Environment Variables:

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (secret) | Supabase Dashboard → Settings → API |

## Troubleshooting

### Build Fails
- Check that **Root Directory** is set to `frontend`
- Verify all environment variables are set
- Check build logs in Vercel dashboard

### Database Connection Issues
- Verify Supabase URL and keys are correct
- Check Supabase project is active
- Ensure RLS policies are applied

### Deployment Issues
- Check Node.js version (should be 20.9.0+)
- Verify `package.json` has correct scripts
- Review Vercel build logs for specific errors

## Next Steps

1. ✅ Code pushed to GitHub
2. ✅ Deployed to Vercel
3. ✅ Site is live
4. 🔄 Set up custom domain (optional)
5. 🔄 Configure monitoring and analytics
6. 🔄 Set up CI/CD for automatic deployments

## Support

- Vercel Docs: https://vercel.com/docs
- GitHub Docs: https://docs.github.com
- Supabase Docs: https://supabase.com/docs

---

**Your platform is now live! 🎉**

