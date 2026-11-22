/**
 * Wikimedia Commons API etiquette: HTTP 429 is a request to stop, not a
 * normal transient error to retry three times within a second.
 *
 * This guard intentionally makes the current discovery run partial rather
 * than claiming "zero images" or circumventing provider rate limits.
 */
export class CommonsRateLimitError extends Error {
  constructor(retryAfterMs) {
    super("Wikimedia Commons HTTP 429: research paused for at least " +
      Math.ceil(retryAfterMs / 1000) + " seconds; remaining models are deferred");
    this.name = "CommonsRateLimitError";
    this.code = "COMMONS_RATE_LIMIT";
    this.retryAfterMs = retryAfterMs;
  }
}

export function parseCommonsRetryAfter(value, nowMs = Date.now()) {
  if (typeof value !== "string" || !value.trim()) return null;
  const raw = value.trim();
  if (/^\d+(?:\.\d+)?$/.test(raw)) {
    const seconds = Number(raw);
    return Number.isFinite(seconds) ? Math.max(0, Math.ceil(seconds * 1000)) : null;
  }
  const date = Date.parse(raw);
  return Number.isFinite(date) ? Math.max(0, date - nowMs) : null;
}

export function createCommonsRateLimitGuard({
  now = () => Date.now(),
  minimumPauseMs = 15 * 60 * 1000
} = {}) {
  let blockedUntilMs = 0;
  return {
    beforeRequest() {
      const remaining = blockedUntilMs - now();
      if (remaining > 0) throw new CommonsRateLimitError(remaining);
    },
    checkResponse(response) {
      if (response.status !== 429) return;
      const hinted = parseCommonsRetryAfter(response.headers?.get("retry-after"), now());
      const pause = Math.max(minimumPauseMs, hinted ?? 0);
      blockedUntilMs = Math.max(blockedUntilMs, now() + pause);
      throw new CommonsRateLimitError(blockedUntilMs - now());
    },
    isPaused() {
      return blockedUntilMs > now();
    }
  };
}
