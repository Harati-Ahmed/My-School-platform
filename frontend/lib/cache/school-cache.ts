/**
 * School metadata cache
 * Caches frequently accessed school records to avoid repeated Supabase reads.
 */

export interface SchoolRecord {
  id: string;
  name?: string | null;
  name_ar?: string | null;
  logo_url?: string | null;
  theme_color?: string | null;
  timezone?: string | null;
  settings?: Record<string, unknown> | null;
  subscription_status?: string | null;
  subscription_plan?: string | null;
  max_students?: number | null;
  max_teachers?: number | null;
  [key: string]: unknown;
}

interface CachedSchool {
  data: SchoolRecord;
  expiresAt: number;
}

const SCHOOL_CACHE = new Map<string, CachedSchool>();
const SCHOOL_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Return a cached school record when available and not expired.
 */
export function getCachedSchool(schoolId: string | null | undefined): SchoolRecord | null {
  if (!schoolId) {
    return null;
  }

  const cached = SCHOOL_CACHE.get(schoolId);
  if (!cached) {
    return null;
  }

  if (cached.expiresAt < Date.now()) {
    SCHOOL_CACHE.delete(schoolId);
    return null;
  }

  return cached.data;
}

/**
 * Cache a school record.
 */
export function setCachedSchool(schoolId: string, school: SchoolRecord): void {
  if (!schoolId) {
    return;
  }

  SCHOOL_CACHE.set(schoolId, {
    data: school,
    expiresAt: Date.now() + SCHOOL_CACHE_TTL_MS,
  });
}

/**
 * Invalidate a specific school record.
 */
export function invalidateSchoolCache(schoolId: string | null | undefined): void {
  if (!schoolId) {
    return;
  }

  SCHOOL_CACHE.delete(schoolId);
}

/**
 * Clear all cached schools.
 */
export function clearSchoolCache(): void {
  SCHOOL_CACHE.clear();
}

// Periodic cleanup to avoid stale entries piling up.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [schoolId, cached] of SCHOOL_CACHE.entries()) {
      if (cached.expiresAt < now) {
        SCHOOL_CACHE.delete(schoolId);
      }
    }
  }, 60 * 1000);
}

