# Remaining TypeScript Errors

## Pattern: Array vs Single Object Mismatches

All remaining errors follow this pattern: Supabase queries return arrays for relations, but types expect single objects.

**Solution:** Extract first element: `Array.isArray(obj) ? obj[0] : obj`

### Remaining Errors:

1. **Line 1555:** AssignmentRow - `classes`/`subjects` are arrays, expect objects
2. **Line 4194:** TopStudentGrade - `student` is array, expects object
3. **Line 5110, 5142:** GradeWithSubject - `subjects`/`users` are arrays, expect objects
4. **Line 5181, 5186:** HomeworkSubmissionRow - `homework` is array, expects object
5. **Line 5394:** JunctionItem - `subjects` is array, expects object
6. **Line 5532:** RecentGrade - `subjects` is array, expects object
7. **Line 5673:** GradeWithSubjectForClass - `subjects` is array, expects object
8. **Line 5796, 5798, 5801:** Null vs required type issues
9. **teacher.ts:** Multiple array access issues

### Fix Pattern Example:

```typescript
// Before (type error):
const name = grade.subjects.name;

// After (fixed):
const subjectData = Array.isArray(grade.subjects) ? grade.subjects[0] : grade.subjects;
const name = subjectData?.name;
```

