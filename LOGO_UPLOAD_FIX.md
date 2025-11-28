# Logo Upload Fix - Implementation Guide

## Problem
The school logo was uploading successfully to Supabase Storage, but the logo URL wasn't being saved to the database because the upload component and settings form were separate.

## Solution Implemented

### 1. Created New Combined Component
**File**: `frontend/components/admin/settings-form-with-logo.tsx`

This new component combines:
- Logo upload functionality
- Settings form
- Saves both the logo URL and settings together

**Key Features**:
- Logo URL is stored in component state
- When logo is uploaded, it updates the state and shows a reminder to save
- When form is submitted, the logo URL is included in the settings update
- Page refreshes after successful save to show the new logo

### 2. Updated Settings Page
**File**: `frontend/app/[locale]/admin/settings/page.tsx`

Changed from using separate components:
```typescript
<SchoolLogoUpload currentLogoUrl={settings.logo_url} />
<SettingsForm initialSettings={settings} />
```

To using the combined component:
```typescript
<SettingsFormWithLogo initialSettings={settings} />
```

### 3. How It Works Now

1. **Upload Logo**:
   - User selects logo file
   - File uploads to Supabase Storage bucket: `school/logos/`
   - Logo URL is stored in component state
   - Preview is shown immediately
   - Toast notification: "Logo uploaded! Don't forget to save your settings."

2. **Save Settings**:
   - User clicks "Save Settings" button
   - All settings + logo URL are saved to database together
   - Page refreshes to show the updated logo everywhere

### 4. Database Schema
The `schools` table already has the `logo_url` column:
```sql
CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    logo_url TEXT,  -- ✓ Already exists
    ...
);
```

### 5. Supabase Storage Setup Required

Make sure the following storage bucket exists and has proper policies:

```sql
-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('school', 'school', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to school bucket
CREATE POLICY "Authenticated users can upload school files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'school');

-- Allow public read access to school files
CREATE POLICY "Public read access for school files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'school');

-- Allow authenticated users to update their school files
CREATE POLICY "Authenticated users can update school files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'school')
WITH CHECK (bucket_id = 'school');

-- Allow authenticated users to delete their school files
CREATE POLICY "Authenticated users can delete school files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'school');
```

### 6. Testing Steps

1. **Navigate to Settings**:
   - Go to `/admin/settings`

2. **Upload Logo**:
   - Click "Upload Logo" button
   - Select an image file (PNG, JPG, or SVG, max 2MB)
   - Wait for "Logo uploaded!" message
   - See the preview of the logo

3. **Save Settings**:
   - Click "Save Settings" button at the bottom of the form
   - Wait for "Settings updated successfully" message
   - Page will refresh

4. **Verify**:
   - Logo should appear in the settings page
   - Check database: `SELECT logo_url FROM schools;`
   - URL should be in format: `https://[project].supabase.co/storage/v1/object/public/school/logos/[filename]`

### 7. User Flow Improvement

The new implementation provides better UX:
- Clear visual feedback when logo is uploaded
- Reminder to save settings
- Logo preview updates immediately
- Single save button for all settings including logo

### 8. Files Modified

1. ✅ `frontend/components/admin/settings-form-with-logo.tsx` - NEW
2. ✅ `frontend/app/[locale]/admin/settings/page.tsx` - UPDATED
3. ℹ️ `frontend/components/admin/school-logo-upload.tsx` - No changes needed (already supports callback)
4. ℹ️ `frontend/lib/services/file-upload.service.ts` - No changes needed (already working)
5. ℹ️ `frontend/lib/actions/admin.ts` - No changes needed (already supports logo_url)

## Next Steps

If the logo still doesn't save after these changes:

1. **Check Supabase Storage Console**:
   - Go to Supabase Dashboard → Storage
   - Verify the `school` bucket exists
   - Check if files are actually being uploaded to `logos/` folder

2. **Check Storage Policies**:
   - Run the SQL policies above in Supabase SQL Editor
   - Verify RLS is enabled on storage.objects

3. **Check Browser Console**:
   - Open DevTools → Console
   - Look for any errors during upload or save

4. **Check Database**:
   - Run: `SELECT id, name, logo_url FROM schools;`
   - Verify the logo_url column has a value after saving

## Common Issues & Solutions

### Issue 1: "Failed to upload file"
**Solution**: Check storage policies and bucket permissions

### Issue 2: Logo uploads but doesn't save to database
**Solution**: Make sure to click "Save Settings" button after uploading

### Issue 3: Logo doesn't display after saving
**Solution**: Check if the URL in database is publicly accessible

### Issue 4: Storage bucket doesn't exist
**Solution**: Run the storage setup SQL above

