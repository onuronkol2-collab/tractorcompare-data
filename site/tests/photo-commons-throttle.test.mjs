import test from "node:test";
import assert from "node:assert/strict";
import {
  CommonsRateLimitError,
  parseCommonsRetryAfter,
  createCommonsRateLimitGuard
} from "../scripts/photo-commons-throttle.mjs";

test("Retry-After seconds and HTTP dates are honored, malformed values fail closed", () => {
  const now = Date.parse("2026-11-22T07:00:00.000Z");
  assert.equal(parseCommonsRetryAfter("120", now), 120000);
  assert.equal(parseCommonsRetryAfter("Sun, 22 Nov 2026 07:03:00 GMT", now), 180000);
  assert.equal(parseCommonsRetryAfter("not a date", now), null);
  assert.equal(parseCommonsRetryAfter(null, now), null);
});

test("429 stops further requests for at least the advertised period", () => {
  let now = 1000;
  const limiter = createCommonsRateLimitGuard({now: () => now, minimumPauseMs: 60000});
  const response = {status:429, headers:new Headers({"Retry-After":"120"})};
  assert.throws(() => limiter.checkResponse(response), e =>
    e instanceof CommonsRateLimitError && e.code === "COMMONS_RATE_LIMIT" && e.retryAfterMs === 120000);
  assert.equal(limiter.isPaused(), true);
  assert.throws(() => limiter.beforeRequest(), /research paused/);
  now += 119999;
  assert.throws(() => limiter.beforeRequest(), /research paused/);
  now += 1;
  assert.doesNotThrow(() => limiter.beforeRequest());
  assert.equal(limiter.isPaused(), false);
});

test("429 without Retry-After still pauses, but successful responses never trip the guard", () => {
  let now = 0;
  const limiter = createCommonsRateLimitGuard({now:()=>now});
  limiter.checkResponse({status:200, headers:new Headers()});
  assert.doesNotThrow(()=>limiter.beforeRequest());
  assert.throws(()=>limiter.checkResponse({status:429,headers:new Headers()}), /HTTP 429/);
  now = 14 * 60 * 1000;
  assert.throws(()=>limiter.beforeRequest(), /research paused/);
  now = 15 * 60 * 1000;
  assert.doesNotThrow(()=>limiter.beforeRequest());
});
