/**
 * Expo push token registration.
 *
 * Obtains the Expo push token for the current device and registers it with the
 * OCRecipes server so that server-driven push notifications can be delivered.
 *
 * Requires:
 *   - EXPO_PUBLIC_PROJECT_ID env var set to the Expo project ID (found in
 *     app.json › expo.extra.eas.projectId or the EAS dashboard).
 *   - expo-notifications permission granted.
 *
 * Graceful degradation: if EXPO_PUBLIC_PROJECT_ID is not set, or if permission
 * is denied, the function returns without throwing. Local notification fallback
 * (useNotebookNotifications) continues to work regardless.
 *
 * Token rotation: this function is called on every login, so if the platform
 * issues a new token the server record is updated automatically via the upsert
 * endpoint.
 */
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { apiRequest } from "./query-client";

const PROJECT_ID = process.env.EXPO_PUBLIC_PROJECT_ID;

/**
 * Register the device's Expo push token with the server.
 * Fire-and-forget — call after a successful login and do not await in hot paths.
 *
 * @returns The registered token string, or null if registration was skipped.
 */
export async function registerPushToken(): Promise<string | null> {
  if (!PROJECT_ID) {
    // No project ID configured — skip silently. Local notifications still work.
    return null;
  }

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== "granted") {
      const { status: requested } =
        await Notifications.requestPermissionsAsync();
      status = requested;
    }
    if (status !== "granted") return null;

    const pushToken = await Notifications.getExpoPushTokenAsync({
      projectId: PROJECT_ID,
    });

    const platform = Platform.OS === "ios" ? "ios" : "android";

    await apiRequest("POST", "/api/push-tokens", {
      token: pushToken.data,
      platform,
    });

    return pushToken.data;
  } catch {
    // Non-fatal: local notifications are the fallback.
    return null;
  }
}
