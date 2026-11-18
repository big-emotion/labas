/**
 * Counts attempts per key in a sliding window; in memory, which is enough for one container.
 * Keys whose window has passed are swept once the map grows, so a script cycling through
 * addresses cannot grow it without bound.
 */
export function limiter(max: number, window: number) {
  const SWEEP_ABOVE = 1000;
  const seen = new Map<string, number[]>();
  return (key: string, now: number): boolean => {
    if (seen.size > SWEEP_ABOVE)
      for (const [stale, times] of seen)
        if (times.every((at) => now - at >= window)) seen.delete(stale);
    const recent = (seen.get(key) ?? []).filter((at) => now - at < window);
    if (recent.length >= max) return false;
    seen.set(key, [...recent, now]);
    return true;
  };
}
