# Remaining English Text to Translate

## Files That Still Have English Text:

### 1. class-form-dialog.tsx
- Toast messages: "Class created successfully", "Class updated successfully", "Failed to save class"
- Dialog titles: "Add New Class", "Edit Class"  
- Dialog descriptions: "Fill in the details...", "Update the class information..."
- Labels: All form field labels
- Placeholders: "Select main teacher"
- Buttons: "Create", "Update", "Cancel"

### 2. subject-form-dialog.tsx
- Toast messages: "Subject created successfully", "Subject updated successfully", "Failed to save subject"
- Dialog titles: "Add New Subject", "Edit Subject"
- Dialog descriptions: "Fill in the details...", "Update the subject information..."
- Labels: All form field labels
- Placeholders: "Select class", "Select teacher"
- Buttons: "Create", "Update", "Cancel"

### 3. announcements-management.tsx
- Toast messages: "Please fill in all required fields", "Announcement created/updated/deleted successfully", "Failed to save/delete announcement"
- Dialog titles: "Create Announcement", "Edit Announcement"
- Dialog descriptions
- Table column labels: "Title", "Audience", "Created By", "Created"
- Search placeholder: "Search announcements..."
- Empty message: "No announcements found"
- Form labels and placeholders
- Buttons

### 4. audit-logs-viewer.tsx
- Toast messages: "Failed to load logs", "Logs refreshed", "Failed to refresh logs"
- Table column labels: "Action", "Entity Type", "User", "Details", "Time"
- Select placeholders: "All actions", "All types"
- Button text: "Apply Filters", "Refreshing..."
- Search placeholder: "Search logs..."
- Empty message: "No audit logs found"

### 5. settings-form.tsx
- Toast messages: "Please fill in all required fields", "Settings updated successfully", "Failed to update settings"
- Form placeholders: "Enter school name", "School address", "Africa/Tripoli"
- All form labels

### 6. bulk-import-dialog.tsx
- Not yet checked - needs full review

## Translation Pattern:
All these files need:
```typescript
import { useTranslations } from "next-intl";

const t = useTranslations("common");
const tAdmin = useTranslations("admin.shared");
```

Then replace all hardcoded English with t("key") or tAdmin("key").

## All Translation Keys Already Exist in en.json and ar.json!

