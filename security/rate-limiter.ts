/**
 * Rate Limiter
 * 
 * Limits actions per time window.
 * Part of security layer.
 */

export interface RateLimitEntry {
  count: number;
  windowStart: number;
  windowMs: number;
}

export interface RateLimiterConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

// In-memory storage
const limiters = new Map<string, RateLimitEntry>();

/**
 * Get or create rate limit entry
 */
function getEntry(key: string, windowMs: number): RateLimitEntry {
  const now = Date.now();
  let entry = limiters.get(key);
  
  // Create new entry if none exists or window expired
  if (!entry || (now - entry.windowStart) >= entry.windowMs) {
    entry = {
      count: 0,
      windowStart: now,
      windowMs
    };
    limiters.set(key, entry);
  }
  
  return entry;
}

/**
 * Check and consume rate limit
 */
export function checkLimit(
  key: string,
  config: RateLimiterConfig
): RateLimitResult {
  const now = Date.now();
  const entry = getEntry(key, config.windowMs);
  
  const resetAt = entry.windowStart + entry.windowMs;
  const remaining = Math.max(0, config.maxRequests - entry.count);
  
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfter: resetAt - now
    };
  }
  
  // Consume one request
  entry.count++;
  
  return {
    allowed: true,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetAt
  };
}

/**
 * Get current limit status without consuming
 */
export function getStatus(
  key: string,
  config: RateLimiterConfig
): RateLimitResult {
  const now = Date.now();
  const entry = getEntry(key, config.windowMs);
  
  const resetAt = entry.windowStart + entry.windowMs;
  const remaining = Math.max(0, config.maxRequests - entry.count);
  
  return {
    allowed: remaining > 0,
    remaining,
    resetAt,
    retryAfter: remaining > 0 ? undefined : resetAt - now
  };
}

/**
 * Reset rate limit for key
 */
export function resetLimit(key: string): void {
  limiters.delete(key);
}

/**
 * Reset all rate limits
 */
export function resetAllLimits(): void {
  limiters.clear();
}

/**
 * Create a rate limiter instance
 */
export function createRateLimiter(config: RateLimiterConfig) {
  return {
    check: (key: string) => checkLimit(key, config),
    status: (key: string) => getStatus(key, config),
    reset: (key: string) => resetLimit(key),
    resetAll: () => resetAllLimits()
  };
}
