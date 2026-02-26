import { describe, it, expect, vi, afterEach } from "vitest";
import { formatTimeAgo } from "../healthkit-sync-utils";

describe("formatTimeAgo", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'just now' for less than 1 hour ago", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:30:00Z"));
    expect(formatTimeAgo("2024-06-15T12:00:00Z")).toBe("just now");
  });

  it("returns '1h ago' for exactly 1 hour", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T13:00:00Z"));
    expect(formatTimeAgo("2024-06-15T12:00:00Z")).toBe("1h ago");
  });

  it("returns hours for 2-23 hours ago", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T17:00:00Z"));
    expect(formatTimeAgo("2024-06-15T12:00:00Z")).toBe("5h ago");
  });

  it("returns '1d ago' for exactly 1 day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-16T12:00:00Z"));
    expect(formatTimeAgo("2024-06-15T12:00:00Z")).toBe("1d ago");
  });

  it("returns days for multiple days ago", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-20T12:00:00Z"));
    expect(formatTimeAgo("2024-06-15T12:00:00Z")).toBe("5d ago");
  });

  it("handles 23 hours as hours, not days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T11:00:00Z"));
    expect(formatTimeAgo("2024-06-14T12:00:00Z")).toBe("23h ago");
  });

  it("returns 'just now' for future dates", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
    expect(formatTimeAgo("2024-06-15T14:00:00Z")).toBe("just now");
  });
});
