/**
 * In-process sliding-window rate limiter.
 *
 * Works for both self-hosted (single process) and Vercel (per-instance).
 * For multi-instance Vercel deployments, set UPSTASH_REDIS_REST_URL +
 * UPSTASH_REDIS_REST_TOKEN to enable distributed rate limiting automatically.
 */

import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } from "./env";

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

let redisClient: Redis | null = null;
const upstashLimiters = new Map<string, Ratelimit>();

if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
  redisClient = new Redis({
    url: UPSTASH_REDIS_REST_URL,
    token: UPSTASH_REDIS_REST_TOKEN,
  });
}

/**
 * Check and increment the rate limit for a given key.
 * @param key      Unique key (e.g. `login:192.168.1.1`)
 * @param maxRequests  Max requests allowed in the window
 * @param windowMs     Window duration in milliseconds
 * @returns `{ allowed: boolean; remaining: number; resetAt: number }`
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  if (redisClient) {
    const limiterKey = `${maxRequests}:${windowMs}`;
    let limiter = upstashLimiters.get(limiterKey);
    if (!limiter) {
      limiter = new Ratelimit({
        redis: redisClient,
        limiter: Ratelimit.slidingWindow(maxRequests, `${windowMs} ms`),
        analytics: false,
      });
      upstashLimiters.set(limiterKey, limiter);
    }
    const { success, remaining, reset } = await limiter.limit(key);
    return {
      allowed: success,
      remaining,
      resetAt: reset,
    };
  }

  const now = Date.now();
  const entry = store.get(key);

  // Purge stale entries on every check (simple GC)
  if (store.size > 10_000) {
    for (const [k, v] of store.entries()) {
      if (now - v.windowStart > windowMs) store.delete(k);
    }
  }

  if (!entry || now - entry.windowStart > windowMs) {
    // New window
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  entry.count++;

  if (entry.count > maxRequests) {
    const resetAt = entry.windowStart + windowMs;
    return { allowed: false, remaining: 0, resetAt };
  }

  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.windowStart + windowMs,
  };
}

/**
 * Extract the best available client IP from a Next.js Request.
 */
export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
