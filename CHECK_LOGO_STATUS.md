# Check Logo Upload Status

## The Problem
You uploaded a logo, but it's showing as text instead of an image. This typically means one of these issues:

1. **Storage bucket not public** - Images can't be accessed
2. **Storage policies not set up** - Browser can't fetch the image
3. **Wrong URL format** - The URL saved doesn't point to a valid image

## Step 1: Check What Was Saved

Run this query in Supabase SQL Editor:

```sql
SELECT id, name, name_ar, logo_url 
FROM schools 
LIMIT 1;
```

**What to look for:**
- The `logo_url` should look like: `https://[your-project].supabase.co/storage/v1/object/public/school/logos/[timestamp]-[random].png`
- If it says something else or is null, the upload didn't complete

## Step 2: Check Supabase Storage

1. Go to your Supabase Dashboard
2. Click on **Storage** in the left sidebar
3. Look for a bucket called **"school"**
4. Click on it and check if there's a **"logos"** folder
5. Open the logos folder and see if your uploaded image is there

**What to check:**
- ✅ Bucket "school" exists
- ✅ Folder "logos" exists inside the bucket
- ✅ Your image file is inside the logos folder
- ✅ The bucket is marked as **PUBLIC** (very important!)

## Step 3: Make Bucket Public

If the bucket exists but isn't public:

1. In Supabase Storage, click on the **"school"** bucket
2. Click the **gear icon** (settings)
3. Make sure **"Public bucket"** is **ENABLED/CHECKED**
4. Click **Save**

## Step 4: Set Up Storage Policies

Run the SQL file I just created:

**File:** `SETUP_STORAGE_BUCKETS.sql`

1. Open Supabase SQL Editor
2. Copy the entire content of `SETUP_STORAGE_BUCKETS.sql`
3. Paste it into the SQL Editor
4. Click **RUN**
5. Wait for "Success. No rows returned"

This will:
- Create the 'school' bucket (if it doesn't exist)
- Make it public
- Set up proper access policies
- Allow admins to upload
- Allow everyone to view

## Step 5: Test the Logo URL Directly

After running the SQL:

1. Get the logo URL from your database:
```sql
SELECT logo_url FROM schools LIMIT 1;
```

2. Copy that URL
3. Open it in a new browser tab
4. You should see the image

**If you see the image** = Storage is working, but there might be an issue with the Image component
**If you get an error** = Storage policies need fixing

## Step 6: Re-upload the Logo

After running the SQL setup:

1. Go back to `/admin/settings`
2. Remove the current logo (click the X button)
3. Upload your logo again
4. Click **"Save Settings"**
5. Page should refresh and show the logo properly

## Common Issues

### Issue: "Bucket not found"
**Solution:** The bucket wasn't created. Run the SQL setup.

### Issue: "Access denied"
**Solution:** Storage policies aren't set. Run the SQL setup.

### Issue: Logo shows as broken image icon
**Solution:** 
- Bucket isn't public OR
- File wasn't uploaded successfully OR
- URL is wrong format

### Issue: No logo_url in database
**Solution:** You uploaded but didn't click "Save Settings". The logo URL is stored in component state but not saved to database until you click save.

## Quick Fix Checklist

Run these in order:

1. ✅ Run `SETUP_STORAGE_BUCKETS.sql` in Supabase SQL Editor
2. ✅ Check Supabase Storage → Verify "school" bucket exists and is **PUBLIC**
3. ✅ Go to Settings page → Remove old logo → Upload new logo
4. ✅ Click **"Save Settings"** button
5. ✅ Page refreshes → Logo should appear

## Need More Help?

If it still doesn't work, please provide:
1. The `logo_url` value from your database
2. Screenshot of your Supabase Storage buckets
3. Any error messages from browser console (F12 → Console tab)

