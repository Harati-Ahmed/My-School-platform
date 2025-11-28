# Phase 3 Translation Fixes Required

## Issue Found
During final check, discovered that Phase 3 teacher features have MANY hardcoded English strings that need to be replaced with translation keys using `t()` function.

## Files Requiring Translation Fixes

### Pages (16 files):
1. ✅ teacher/dashboard/page.tsx - **Has hardcoded strings**
2. ✅ teacher/classes/page.tsx - **Has hardcoded strings**
3. ✅ teacher/classes/[id]/page.tsx - **Has hardcoded strings**
4. ✅ teacher/homework/page.tsx - **Has hardcoded strings**
5. ✅ teacher/homework/create/page.tsx - **Has hardcoded strings**
6. ✅ teacher/homework/edit/[id]/page.tsx - **Has hardcoded strings**
7. ✅ teacher/grades/page.tsx - **Has hardcoded strings**
8. ✅ teacher/grades/[classId]/page.tsx - **Has hardcoded strings**
9. ✅ teacher/attendance/page.tsx - **Has hardcoded strings**
10. ✅ teacher/attendance/[classId]/page.tsx - **Has hardcoded strings**
11. ✅ teacher/notes/page.tsx - **Has hardcoded strings**
12. ✅ teacher/notes/create/page.tsx - **Has hardcoded strings**
13. ✅ teacher/reports/page.tsx - **Has hardcoded strings**
14. ✅ teacher/reports/statistics/page.tsx - **Has hardcoded strings**
15. ✅ teacher/reports/generate/page.tsx - **Has hardcoded strings**
16. teacher/layout.tsx - Mostly OK (uses t())

### Components (8 files):
1. ✅ teacher/homework-form.tsx - **Has hardcoded strings**
2. ✅ teacher/homework-actions.tsx - **Has hardcoded strings**
3. ✅ teacher/bulk-grade-entry.tsx - **Has hardcoded strings**
4. ✅ teacher/attendance-marker.tsx - **Has hardcoded strings**
5. ✅ teacher/teacher-note-form.tsx - **Has hardcoded strings**
6. ✅ teacher/teacher-note-actions.tsx - **Has hardcoded strings**
7. ✅ teacher/class-statistics.tsx - **Has hardcoded strings**
8. ✅ teacher/report-generator.tsx - **Has hardcoded strings**

## Types of Hardcoded Strings Found

### Common Patterns:
- Descriptions: "Manage your classes and view student information"
- Empty states: "No Classes Assigned", "No recent homework"
- Action buttons: "View Students", "Mark Attendance", "Generate Report"
- Form labels: "Select class", "Search by name"
- Placeholders: "e.g., Math Chapter 5", "Search students..."
- Helper text: "How to Add Grades", "Classes you teach"
- Status messages: "Across all your classes"

## Estimated Hardcoded Strings
- **~200+ hardcoded English strings** found across all Phase 3 files
- All translation keys already exist in `en.json` and `ar.json`
- Just need to replace hardcoded text with `t()` function calls

## Priority
**HIGH** - Without these fixes, the application won't work properly for Arabic users!

## Status
- [x] Translation keys created in en.json (✅ Complete)
- [x] Translation keys created in ar.json (✅ Complete)  
- [ ] Replace hardcoded strings in page components (🔄 In Progress)
- [ ] Replace hardcoded strings in UI components (🔄 In Progress)
- [ ] Final testing with both locales (⏳ Pending)

