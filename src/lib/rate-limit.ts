// Simple in-memory rate limiter — resets on cold start (serverless OK for brute-force protection)
// ponytail: upgrade to Redis/Upstash when multi-instance needed

interface RateLimitEntry { count: number; resetAt: number; }
const store = new Map<string, RateLimitEntry>();

/**
 * Returns true if request is allowed, false if rate-limited.
 * @param key     identifier (IP or username)
 * @param limit   max requests per window
 * @param windowMs window in milliseconds
 */
export function checkRateLimit(key: string, limit = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

export function getRateLimitHeaders(key: string, limit = 10, windowMs = 60_000) {
  const entry = store.get(key);
  const remaining = entry ? Math.max(0, limit - entry.count) : limit;
  const reset = entry ? Math.ceil(entry.resetAt / 1000) : Math.ceil((Date.now() + windowMs) / 1000);
  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(reset),
  };
}
