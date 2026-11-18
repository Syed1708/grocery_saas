// lib/auth/rate-limit.ts
// Lightweight fixed-window rate limiter for the credentials login endpoint.
// In-memory (per server instance); swap for Redis/DB if deploying multi-instance.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  limited: boolean;
  retryAfterMs: number;
}

/** Check whether a key has exhausted its attempt budget for the window. */
export function isRateLimited(key: string, maxAttempts: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    if (bucket) buckets.delete(key);
    return { limited: false, retryAfterMs: 0 };
  }

  if (bucket.count >= maxAttempts) {
    return { limited: true, retryAfterMs: bucket.resetAt - now };
  }

  return { limited: false, retryAfterMs: 0 };
}

/** Record a failed attempt against a key. */
export function registerFailure(key: string, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
  } else {
    bucket.count += 1;
  }

  // Opportunistic cleanup so the map cannot grow unbounded.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (now > v.resetAt) buckets.delete(k);
    }
  }
}

/** Clear the attempt budget (called on a successful login). */
export function resetRateLimit(key: string) {
  buckets.delete(key);
}

export function rateLimitMessage(retryAfterMs: number): string {
  const minutes = Math.max(1, Math.ceil(retryAfterMs / 60000));
  return `Too many login attempts. Please try again in ${minutes} minute${minutes > 1 ? "s" : ""}.`;
}

/** Extract the caller IP from NextAuth's request headers. */
export function getClientIp(req: unknown): string {
  const headers = (req as { headers?: Record<string, unknown> } | undefined)?.headers;
  const forwarded = headers?.["x-forwarded-for"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const ip = typeof raw === "string" ? raw.split(",")[0]?.trim() : undefined;
  return ip && ip.length > 0 ? ip : "unknown";
}
