# 🚀 Production Deployment Guide

**Date**: December 2024  
**Status**: ✅ **Ready for Deployment**

---

## 📋 Pre-Deployment Checklist

- ✅ All migrations applied to production database
- ✅ TypeScript errors fixed
- ✅ Build successful
- ✅ Environment variables documented
- ✅ Security audit completed
- ✅ Performance optimizations verified
- ✅ Authentication/Authorization verified

---

## 🌐 Vercel Deployment (Frontend)

### Step 1: Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your Git repository
4. Select the repository

### Step 2: Configure Project

**Root Directory**: `frontend`

**Build Settings**:
- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

**Node.js Version**: 20.9.0 or higher (configured in `package.json`)

### Step 3: Environment Variables

Add the following environment variables in Vercel Dashboard:

#### Required Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://evcpzlanlkafruugifas.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Next.js
NODE_ENV=production
```

#### Optional Variables

```bash
# Analytics (if using)
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for build to complete
3. Verify deployment at the provided URL

### Step 5: Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Configure DNS records as instructed
4. SSL certificate will be auto-provisioned

---

## 🗄️ Supabase Configuration (Database)

### Production Database

**Project**: Tilmeedhy-Live  
**Project ID**: `evcpzlanlkafruugifas`  
**URL**: `https://evcpzlanlkafruugifas.supabase.co`

### Database Migrations

✅ **All migrations applied**:
- Initial schema
- RLS policies
- Indexes
- Functions and triggers
- Performance optimizations

### Supabase Settings

1. **Authentication**:
   - Enable Email provider
   - Configure email templates
   - Set password requirements

2. **Storage**:
   - Enable Storage
   - Configure bucket policies
   - Set file size limits

3. **API**:
   - Get `anon` key (for `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - Get `service_role` key (for `SUPABASE_SERVICE_ROLE_KEY`)

---

## 🔐 Environment Variables Reference

See `frontend/.env.example` for complete list of required variables.

### Critical Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (secret) | Supabase Dashboard → Settings → API |

---

## ✅ Post-Deployment Verification

### 1. Test Authentication
- [ ] Login works
- [ ] Logout works
- [ ] Password reset works
- [ ] Session persists

### 2. Test Authorization
- [ ] Admin can access admin routes
- [ ] Teacher can access teacher routes
- [ ] Parent can access parent routes
- [ ] Unauthorized access is blocked

### 3. Test Core Features
- [ ] Dashboard loads
- [ ] Data displays correctly
- [ ] Forms submit successfully
- [ ] File uploads work
- [ ] Reports generate

### 4. Performance Check
- [ ] Page load times acceptable
- [ ] Images load correctly
- [ ] No console errors
- [ ] Mobile responsive

---

## 🔧 Troubleshooting

### Build Fails

1. Check Node.js version (must be >= 20.9.0)
2. Verify all environment variables are set
3. Check build logs for specific errors
4. Ensure `package.json` has correct scripts

### Database Connection Issues

1. Verify Supabase URL and keys are correct
2. Check Supabase project is active
3. Verify RLS policies are applied
4. Check network connectivity

### Authentication Issues

1. Verify email provider is enabled in Supabase
2. Check email templates are configured
3. Verify environment variables are set correctly
4. Check Supabase Auth logs

---

## 📊 Monitoring

### Vercel Analytics
- Enable in Vercel Dashboard
- Monitor page views, performance
- Track errors and issues

### Supabase Dashboard
- Monitor database performance
- Check query logs
- Review authentication logs
- Monitor storage usage

---

## 🚨 Rollback Procedure

If deployment has issues:

1. **Vercel**: Go to Deployments → Select previous deployment → Promote to Production
2. **Database**: Migrations are idempotent, but can rollback if needed
3. **Environment Variables**: Revert to previous values if needed

---

## 📝 Maintenance

### Regular Tasks

- [ ] Monitor error logs weekly
- [ ] Review performance metrics monthly
- [ ] Update dependencies quarterly
- [ ] Review security patches monthly
- [ ] Backup database regularly

### Updates

1. Test changes in development
2. Run type checking: `npm run type-check`
3. Run build: `npm run build`
4. Deploy to staging (if available)
5. Deploy to production

---

## 🎯 Production URLs

After deployment, update these:

- **Frontend**: `https://your-domain.vercel.app`
- **Supabase**: `https://evcpzlanlkafruugifas.supabase.co`
- **API**: Server Actions (no separate API needed)

---

**Status**: ✅ **Ready for Production Deployment**

All configurations are in place. Follow the steps above to deploy to Vercel.

