interface RateLimitRecord {
    count: number;
    resetAt: number;
}

const store = new Map<string, RateLimitRecord>();

/**
 * Basic in-memory rate limiter.
 * @param ip Client IP address (from x-forwarded-for or similar)
 * @param limit Max requests allowed in the time window (e.g. 5)
 * @param windowMs Time window in milliseconds (e.g. 600000 for 10m)
 * @returns true if allowed, false if rate limited
 */
export function checkRateLimit(ip: string, limit: number = 5, windowMs: number = 600000): boolean {
    const now = Date.now();

    // 1. Clean up stale entries periodically (simple garbage collection on check)
    // To keep it highly performant and avoid looping the entire map constantly, 
    // we just check and delete the specific IP if its time has expired.
    // If we wanted aggressive cleanup, we could loop `store.entries()` occasionally,
    // but a Map lookup is O(1) so memory bloat is minimal for a standard website.

    const record = store.get(ip);

    if (!record || now > record.resetAt) {
        // First time seeing IP, or their window expired
        store.set(ip, {
            count: 1,
            resetAt: now + windowMs
        });
        return true;
    }

    if (record.count >= limit) {
        // Exceeded limit within the current window
        return false;
    }

    // Increment count for active window
    record.count += 1;
    store.set(ip, record);
    return true;
}
