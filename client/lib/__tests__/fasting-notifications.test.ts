import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock expo-notifications
const mockSchedule = vi.fn().mockResolvedValue("mock-id");
const mockCancel = vi.fn().mockResolvedValue(undefined);

vi.mock("expo-notifications", () => ({
  scheduleNotificationAsync: (...args: unknown[]) => mockSchedule(...args),
  cancelScheduledNotificationAsync: (...args: unknown[]) => mockCancel(...args),
  SchedulableTriggerInputTypes: {
    DATE: "date",
    DAILY: "daily",
  },
}));

const {
  scheduleMilestoneNotifications,
  scheduleCheckInNotifications,
  scheduleEatingWindowNotifications,
  cancelAllFastingNotifications,
} = await import("../fasting-notifications");

describe("fasting-notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("scheduleMilestoneNotifications", () => {
    it("schedules notifications for future milestones only", async () => {
      // Fast started 2 hours ago with 16h target
      const startedAt = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const ids = await scheduleMilestoneNotifications(startedAt, 16);

      // Should schedule for 12h and 16h (both in the future)
      expect(mockSchedule).toHaveBeenCalledTimes(2);
      expect(ids).toHaveLength(2);
    });

    it("skips milestones already passed", async () => {
      // Fast started 13 hours ago with 16h target
      const startedAt = new Date(Date.now() - 13 * 60 * 60 * 1000);
      const ids = await scheduleMilestoneNotifications(startedAt, 16);

      // Only 16h milestone is in the future
      expect(mockSchedule).toHaveBeenCalledTimes(1);
      expect(ids).toHaveLength(1);
    });

    it("returns empty array when all milestones passed", async () => {
      // Fast started 25 hours ago with 16h target
      const startedAt = new Date(Date.now() - 25 * 60 * 60 * 1000);
      const ids = await scheduleMilestoneNotifications(startedAt, 16);

      expect(mockSchedule).not.toHaveBeenCalled();
      expect(ids).toEqual([]);
    });

    it("uses fallback message for non-standard milestone hours", async () => {
      // 18:6 protocol — 18h is not in MILESTONE_MESSAGES
      const startedAt = new Date(Date.now() - 1 * 60 * 60 * 1000);
      await scheduleMilestoneNotifications(startedAt, 18);

      // Should schedule 12h, 16h, 18h
      expect(mockSchedule).toHaveBeenCalledTimes(3);

      // Check the 18h call uses fallback message
      const call18h = mockSchedule.mock.calls.find((call: unknown[]) =>
        (call[0] as { content: { title: string } }).content.title.includes(
          "18",
        ),
      );
      expect(call18h).toBeDefined();
    });
  });

  describe("scheduleCheckInNotifications", () => {
    it("schedules up to 4 check-ins starting at 6h", async () => {
      const startedAt = new Date(Date.now() - 1 * 60 * 60 * 1000);
      const ids = await scheduleCheckInNotifications(startedAt);

      // 6h, 9h, 12h, 15h — all in future
      expect(mockSchedule).toHaveBeenCalledTimes(4);
      expect(ids).toHaveLength(4);
    });

    it("skips past check-ins", async () => {
      // Started 10 hours ago — 6h and 9h are past
      const startedAt = new Date(Date.now() - 10 * 60 * 60 * 1000);
      const ids = await scheduleCheckInNotifications(startedAt);

      // Only 12h and 15h are in the future
      expect(mockSchedule).toHaveBeenCalledTimes(2);
      expect(ids).toHaveLength(2);
    });
  });

  describe("scheduleEatingWindowNotifications", () => {
    it("schedules open and close notifications", async () => {
      const ids = await scheduleEatingWindowNotifications("12:00", "20:00");

      expect(mockSchedule).toHaveBeenCalledTimes(2);
      expect(ids).toHaveLength(2);

      // Check open notification
      const openCall = mockSchedule.mock.calls[0][0];
      expect(openCall.content.title).toBe("Eating Window Open");
      expect(openCall.trigger.hour).toBe(12);
      expect(openCall.trigger.minute).toBe(0);

      // Check close notification
      const closeCall = mockSchedule.mock.calls[1][0];
      expect(closeCall.content.title).toBe("Eating Window Closing");
      expect(closeCall.trigger.hour).toBe(20);
      expect(closeCall.trigger.minute).toBe(0);
    });
  });

  describe("cancelAllFastingNotifications", () => {
    it("cancels all notification IDs in parallel", async () => {
      await cancelAllFastingNotifications(["id-1", "id-2", "id-3"]);

      expect(mockCancel).toHaveBeenCalledTimes(3);
      expect(mockCancel).toHaveBeenCalledWith("id-1");
      expect(mockCancel).toHaveBeenCalledWith("id-2");
      expect(mockCancel).toHaveBeenCalledWith("id-3");
    });

    it("handles empty array", async () => {
      await cancelAllFastingNotifications([]);
      expect(mockCancel).not.toHaveBeenCalled();
    });
  });
});
