/**
 * Fasting-specific notification scheduling.
 * Schedules local notifications for milestones, check-ins, and eating windows.
 * Uses Promise.all for parallel bridge crossings (review #4).
 */
import * as Notifications from "expo-notifications";
import { getMilestoneHours } from "@/components/fasting-display-utils";

// ---------------------------------------------------------------------------
// Notification content
// ---------------------------------------------------------------------------

const MILESTONE_MESSAGES: Record<number, { title: string; body: string }> = {
  12: {
    title: "12 Hours \u2014 Fat Burning!",
    body: "Your body has shifted to burning stored fat for energy. Keep going!",
  },
  16: {
    title: "16 Hours \u2014 Autophagy!",
    body: "Cellular cleanup is underway. Your cells are recycling damaged components.",
  },
  20: {
    title: "20 Hours \u2014 Deep Ketosis",
    body: "Ketone levels are elevated. You may notice increased mental clarity.",
  },
  24: {
    title: "24 Hours \u2014 Major Milestone!",
    body: "A full day of fasting. Growth hormone is surging and deep autophagy is active.",
  },
};

const CHECK_IN_MESSAGES = [
  {
    title: "You're doing great!",
    body: "Remember to stay hydrated and listen to your body.",
  },
  {
    title: "Keep it up!",
    body: "Hunger waves pass in about 20 minutes. You've got this.",
  },
  {
    title: "Staying strong!",
    body: "Your body is adapting. Each fast gets easier.",
  },
  {
    title: "Almost there!",
    body: "Think about how great you'll feel when you hit your target.",
  },
];

// ---------------------------------------------------------------------------
// Scheduling functions — all use Promise.all for parallel scheduling
// ---------------------------------------------------------------------------

/** Schedule milestone notifications relative to fast start. */
export async function scheduleMilestoneNotifications(
  startedAt: Date,
  targetHours: number,
): Promise<string[]> {
  const milestones = getMilestoneHours(targetHours);
  const now = Date.now();

  const pending = milestones
    .map((hour) => {
      const triggerDate = new Date(startedAt.getTime() + hour * 60 * 60 * 1000);
      if (triggerDate.getTime() <= now) return null;

      const message = MILESTONE_MESSAGES[hour] ?? {
        title: `${hour} Hour Milestone!`,
        body: `You've been fasting for ${hour} hours. Great discipline!`,
      };

      return Notifications.scheduleNotificationAsync({
        content: {
          title: message.title,
          body: message.body,
          sound: "default",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
          channelId: "fasting",
        },
      });
    })
    .filter(Boolean) as Promise<string>[];

  return Promise.all(pending);
}

/** Schedule supportive check-ins (every 3h after 6h elapsed, max 4). */
export async function scheduleCheckInNotifications(
  startedAt: Date,
): Promise<string[]> {
  const START_AFTER_HOURS = 6;
  const INTERVAL_HOURS = 3;
  const MAX_CHECK_INS = 4;
  const now = Date.now();

  const pending: Promise<string>[] = [];
  for (let i = 0; i < MAX_CHECK_INS; i++) {
    const hour = START_AFTER_HOURS + i * INTERVAL_HOURS;
    const triggerDate = new Date(startedAt.getTime() + hour * 60 * 60 * 1000);
    if (triggerDate.getTime() <= now) continue;

    const message = CHECK_IN_MESSAGES[i % CHECK_IN_MESSAGES.length];
    pending.push(
      Notifications.scheduleNotificationAsync({
        content: {
          title: message.title,
          body: message.body,
          sound: "default",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
          channelId: "fasting",
        },
      }),
    );
  }

  return Promise.all(pending);
}

/** Schedule daily eating window reminders at open/close times. */
export async function scheduleEatingWindowNotifications(
  windowStart: string, // "HH:MM"
  windowEnd: string, // "HH:MM"
): Promise<string[]> {
  const [startH, startM] = windowStart.split(":").map(Number);
  const [endH, endM] = windowEnd.split(":").map(Number);

  return Promise.all([
    Notifications.scheduleNotificationAsync({
      content: {
        title: "Eating Window Open",
        body: "Your eating window is now open. Time to refuel!",
        sound: "default",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: startH,
        minute: startM,
        channelId: "fasting",
      },
    }),
    Notifications.scheduleNotificationAsync({
      content: {
        title: "Eating Window Closing",
        body: "Your eating window is closing soon. Last chance to eat!",
        sound: "default",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: endH,
        minute: endM,
        channelId: "fasting",
      },
    }),
  ]);
}

/** Cancel all fasting notifications by IDs. */
export async function cancelAllFastingNotifications(
  ids: string[],
): Promise<void> {
  await Promise.all(
    ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)),
  );
}
