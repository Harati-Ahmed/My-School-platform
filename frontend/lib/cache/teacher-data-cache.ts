/**
 * Cache for teacher-related data (subjects, classes, grade levels)
 * Reduces database calls by caching static/reference data
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class TeacherDataCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL

  /**
   * Get cached data if it exists and is not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      // Cache expired, remove it
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear specific cache entry
   */
  clear(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Invalidate cache for a specific key (force refresh on next get)
   */
  invalidate(key: string): void {
    this.clear(key);
  }
}

// Singleton instance
export const teacherDataCache = new TeacherDataCache();

// Cache keys
export const CACHE_KEYS = {
  SUBJECTS: 'teacher-subjects',
  CLASSES: 'teacher-classes',
  GRADE_LEVELS: 'teacher-grade-levels',
  TEACHER_SUBJECTS: (teacherId: string) => `teacher-${teacherId}-subjects`,
  TEACHER_GRADE_LEVELS: (teacherId: string) => `teacher-${teacherId}-grade-levels`,
  TEACHER_CLASSES: (teacherId: string) => `teacher-${teacherId}-classes`,
} as const;

