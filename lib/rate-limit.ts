/**
 * Simple in-memory sliding-window rate limiter for API routes.
 * Not shared across serverless instances — sufficient for basic abuse prevention.
 * For production at scale, replace with Upstash Redis or similar.
 */

type RateLimitEntry = {
  timestamps: number[];
};

const store = new Map<string, RateLimitEntry>();

/** Cleanup stale entries every 5 minutes */
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

const cleanup = (windowMs: number) => {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  const cutoff = now - windowMs;
  store.forEach((entry, key) => {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) store.delete(key);
  });
};

type RateLimitOptions = {
  /** Unique key for this limiter (e.g. "pvp", "shop") */
  prefix: string;
  /** Time window in milliseconds (default: 60_000 = 1 min) */
  windowMs?: number;
  /** Max requests per window (default: 20) */
  maxRequests?: number;
};

type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterMs: number };

/**
 * Check if a request from `identifier` (e.g. userId) is within rate limits.
 */
export const checkRateLimit = (
  identifier: string,
  options: RateLimitOptions
): RateLimitResult => {
  const { prefix, windowMs = 60_000, maxRequests = 20 } = options;
  const key = `${prefix}:${identifier}`;
  const now = Date.now();
  const cutoff = now - windowMs;

  cleanup(windowMs);

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove expired timestamps
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= maxRequests) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfterMs = oldestInWindow + windowMs - now;
    return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 1000) };
  }

  entry.timestamps.push(now);
  return { allowed: true };
};
