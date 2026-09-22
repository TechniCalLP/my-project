/**
 * Simple in-memory sliding-window rate limiter, scoped per server instance.
 * Not a substitute for a distributed limiter under heavy multi-instance load,
 * but it meaningfully raises the bar against a naive brute-force script
 * (which now has to spread guesses across many cold-started instances
 * instead of hammering one) for a small-scale app like this one.
 */
const attemptsByKey = new Map<string, number[]>()

/** True if `key` is still under its allowed attempt count within `windowMs`. */
export function isRateLimited(key: string, maxAttempts: number, windowMs: number): boolean {
  const now = Date.now()
  const timestamps = (attemptsByKey.get(key) ?? []).filter((t) => now - t < windowMs)
  attemptsByKey.set(key, timestamps)
  return timestamps.length >= maxAttempts
}

/** Records one attempt against `key` (call this on failure, not on success). */
export function recordAttempt(key: string): void {
  const now = Date.now()
  const timestamps = attemptsByKey.get(key) ?? []
  timestamps.push(now)
  attemptsByKey.set(key, timestamps)
}
