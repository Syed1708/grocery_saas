// lib/auth/rate-limit.ts
// Database-backed fixed-window rate limiter for the credentials login endpoint.
// Shared across server instances and survives restarts.

import { prisma } from "@/lib/prisma";

export interface RateLimitResult {
  limited: boolean;
  retryAfterMs: number;
}

/** Check whether a key has exhausted its attempt budget for the window. */
export async function isRateLimited(
  key: string,
  maxAttempts: number
): Promise<RateLimitResult> {
  const now = new Date();
  const bucket = await prisma.rateLimitBucket.findUnique({ where: { key } });

  if (!bucket || bucket.resetAt <= now) {
    return { limited: false, retryAfterMs: 0 };
  }

  if (bucket.count >= maxAttempts) {
    return { limited: true, retryAfterMs: bucket.resetAt.getTime() - now.getTime() };
  }

  return { limited: false, retryAfterMs: 0 };
}

/** Record a failed attempt against a key. */
export async function registerFailure(key: string, windowMs: number) {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);

  // Reset an expired bucket atomically.
  const reset = await prisma.rateLimitBucket.updateMany({
    where: { key, resetAt: { lte: now } },
    data: { count: 1, resetAt },
  });

  if (reset.count === 0) {
    try {
      await prisma.rateLimitBucket.upsert({
        where: { key },
        create: { key, count: 1, resetAt },
        update: { count: { increment: 1 } },
      });
    } catch {
      // Concurrent first-insert race: the row now exists, increment it.
      await prisma.rateLimitBucket.update({
        where: { key },
        data: { count: { increment: 1 } },
      });
    }
  }

  // Opportunistic cleanup (indexed on resetAt) so the table cannot grow unbounded.
  if (Math.random() < 0.02) {
    await prisma.rateLimitBucket.deleteMany({ where: { resetAt: { lt: now } } });
  }
}

/** Clear the attempt budget (called on a successful login). */
export async function resetRateLimit(key: string) {
  await prisma.rateLimitBucket.deleteMany({ where: { key } });
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
