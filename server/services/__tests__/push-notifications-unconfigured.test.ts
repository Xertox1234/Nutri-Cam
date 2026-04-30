/**
 * Tests the sendPushToUser graceful-degradation path when EXPO_ACCESS_TOKEN
 * is absent. This lives in a separate file so the module loads fresh without
 * the env var set — the singleton in push-notifications.ts is lazy, so the
 * first import in this file sees a null client.
 *
 * vi.isolateModules() is not available in Vitest 4.x; a dedicated file
 * achieves the same isolation because each test file runs in its own worker.
 */
import { describe, it, expect, vi } from "vitest";
import { storage } from "../../storage";

import { sendPushToUser } from "../push-notifications";

// EXPO_ACCESS_TOKEN intentionally NOT stubbed — module must see no token.

const expoMock = vi.hoisted(() => ({
  send: vi.fn(),
  chunk: vi.fn((msgs: unknown[]) => [msgs]),
  isToken: vi.fn().mockReturnValue(true),
}));

vi.mock("expo-server-sdk", () => ({
  default: class MockExpo {
    sendPushNotificationsAsync = expoMock.send;
    chunkPushNotifications = expoMock.chunk;
    static isExpoPushToken = expoMock.isToken;
  },
}));

vi.mock("../../storage", () => ({
  storage: {
    getPushTokensForUser: vi.fn(),
    deletePushToken: vi.fn(),
  },
}));

describe("sendPushToUser — EXPO_ACCESS_TOKEN absent", () => {
  it("returns false immediately without fetching tokens", async () => {
    const result = await sendPushToUser("1", "Coach reminder", "Drink water");

    expect(result).toBe(false);
    // getExpo() returns null → returns before storage or Expo are called
    expect(storage.getPushTokensForUser).not.toHaveBeenCalled();
    expect(expoMock.send).not.toHaveBeenCalled();
  });
});
