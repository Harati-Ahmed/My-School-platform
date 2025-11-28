/**
 * Session Cache Utility
 * Caches Supabase auth sessions and user profiles to reduce database queries
 */

type CachedSession = {
  userId: string;
  schoolId: string | null;
  isSuperAdmin: boolean;
  email: string;
  role: string;
  expiresAt: number;
};

// In-memory cache (simple Map)
// In production, consider using Redis for multi-instance deployments
const sessionCache = new Map<string, CachedSession>();

// Cache TTL: 5 minutes (300000ms)
const CACHE_TTL_MS = 5 * 60 * 1000;

// Cleanup interval: remove expired entries every minute
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, session] of sessionCache.entries()) {
      if (session.expiresAt < now) {
        sessionCache.delete(key);
      }
    }
  }, 60 * 1000);
}

/**
 * Get cached session by user ID
 */
export function getCachedSession(userId: string): CachedSession | null {
  const cached = sessionCache.get(userId);
  if (!cached) return null;

  // Check if expired
  if (cached.expiresAt < Date.now()) {
    sessionCache.delete(userId);
    return null;
  }

  return cached;
}

/**
 * Set cached session by user ID
 */
export function setCachedSession(
  userId: string,
  session: Omit<CachedSession, "expiresAt">
): void {
  sessionCache.set(userId, {
    ...session,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

/**
 * Invalidate all sessions for a user (when user profile changes)
 */
export function invalidateUserSessions(userId: string): void {
  for (const [key, session] of sessionCache.entries()) {
    if (session.userId === userId) {
      sessionCache.delete(key);
    }
  }
}

/**
 * Clear all cached sessions (for testing or emergency)
 */
export function clearAllSessions(): void {
  sessionCache.clear();
}

