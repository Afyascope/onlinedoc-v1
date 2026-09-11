type Entry = { minute: number[]; hour: number[] };
const entries = new Map<string, Entry>();

/** In-memory fallback limiter. Replace the store with Redis/DB for multi-instance deployments. */
export function emailRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = entries.get(key) || { minute: [], hour: [] };
  entry.minute = entry.minute.filter((time) => now - time < 60_000);
  entry.hour = entry.hour.filter((time) => now - time < 3_600_000);
  if (entry.minute.length >= 1 || entry.hour.length >= 5) { entries.set(key, entry); return false; }
  entry.minute.push(now); entry.hour.push(now); entries.set(key, entry); return true;
}
