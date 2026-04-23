import { describe, it, expect, vi, beforeEach } from "vitest";
import { setWarmUp, consumeWarmUp, WARM_UP_TTL_MS } from "../coach-warm-up";

vi.mock("../../lib/logger", () => ({
  createServiceLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe("consumeWarmUp", () => {
  const MESSAGES = [{ role: "user" as const, content: "hello" }];

  beforeEach(() => {
    // Consume any stale entry to isolate tests
    consumeWarmUp("user1", 1, "stale");
  });

  it("returns messages when warm-up exists and id matches", () => {
    setWarmUp("user1", 1, "wuid-1", MESSAGES);
    const result = consumeWarmUp("user1", 1, "wuid-1");
    expect(result).toEqual(MESSAGES);
  });

  it("returns null when no warm-up exists for the key", () => {
    const result = consumeWarmUp("user1", 999, "wuid-x");
    expect(result).toBeNull();
  });

  it("returns null when warm-up id does not match", () => {
    setWarmUp("user1", 1, "wuid-correct", MESSAGES);
    const result = consumeWarmUp("user1", 1, "wuid-wrong");
    expect(result).toBeNull();
  });

  it("returns null when warm-up has expired", () => {
    vi.useFakeTimers();
    setWarmUp("user1", 1, "wuid-2", MESSAGES);
    vi.advanceTimersByTime(WARM_UP_TTL_MS + 1);
    const result = consumeWarmUp("user1", 1, "wuid-2");
    expect(result).toBeNull();
    vi.useRealTimers();
  });

  it("is destructive — second consume returns null", () => {
    setWarmUp("user1", 1, "wuid-3", MESSAGES);
    const first = consumeWarmUp("user1", 1, "wuid-3");
    const second = consumeWarmUp("user1", 1, "wuid-3");
    expect(first).toEqual(MESSAGES);
    expect(second).toBeNull();
  });
});
