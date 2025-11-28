/**
 * Teacher assignments cache
 * Caches teacher-class-subject assignments and grade levels to avoid repeated Supabase reads.
 */

export interface TeacherAssignmentData {
  subjects: Array<{
    id: string;
    name: string;
    name_ar?: string | null;
    code?: string | null;
    school_id: string | null;
  }>;
  grade_levels: string[];
}

interface CachedAssignment {
  data: TeacherAssignmentData;
  timestamp: number;
}

const ASSIGNMENT_CACHE = new Map<string, CachedAssignment>();
const GRADE_LEVEL_CACHE = new Map<string, string[]>();
const TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached teacher assignments for a specific teacher
 */
export function getCachedTeacherAssignments(
  teacherId: string
): TeacherAssignmentData | null {
  const cached = ASSIGNMENT_CACHE.get(teacherId);
  if (!cached) {
    return null;
  }

  if (Date.now() - cached.timestamp > TTL) {
    ASSIGNMENT_CACHE.delete(teacherId);
    GRADE_LEVEL_CACHE.delete(teacherId);
    return null;
  }

  return cached.data;
}

/**
 * Cache teacher assignments data
 */
export function setCachedTeacherAssignments(
  teacherId: string,
  data: TeacherAssignmentData
): void {
  ASSIGNMENT_CACHE.set(teacherId, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Invalidate cached assignments for a specific teacher
 */
export function invalidateTeacherAssignments(teacherId: string): void {
  ASSIGNMENT_CACHE.delete(teacherId);
  GRADE_LEVEL_CACHE.delete(teacherId);
}

/**
 * Invalidate all cached assignments for a school (useful when subjects/classes change)
 */
export function invalidateSchoolAssignments(schoolId: string): void {
  // Note: This is a simple implementation. For large schools, consider storing
  // schoolId -> teacherIds mapping for more efficient invalidation.
  for (const [teacherId, cached] of ASSIGNMENT_CACHE.entries()) {
    // We don't have schoolId in cache, so we'll just clear all
    // This is fine for now since TTL will expire old entries anyway
  }
  ASSIGNMENT_CACHE.clear();
  GRADE_LEVEL_CACHE.clear();
}

/**
 * Batch cache multiple teachers' assignments
 */
export function setCachedTeacherAssignmentsBatch(
  assignments: Map<string, TeacherAssignmentData>
): void {
  const now = Date.now();
  for (const [teacherId, data] of assignments.entries()) {
    ASSIGNMENT_CACHE.set(teacherId, { data, timestamp: now });
  }
}

// Periodic cleanup to avoid stale entries
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [teacherId, cached] of ASSIGNMENT_CACHE.entries()) {
      if (now - cached.timestamp > TTL) {
        ASSIGNMENT_CACHE.delete(teacherId);
        GRADE_LEVEL_CACHE.delete(teacherId);
      }
    }
  }, 60 * 1000); // Run every minute
}

