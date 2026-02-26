/**
 * Pure formatting utilities for HealthKitSyncIndicator.
 * Extracted for testability — no React or RN dependencies.
 */

/** Format a date string as relative time: "just now", "3h ago", "2d ago". */
export function formatTimeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours === 1) return "1h ago";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1d ago";
  return `${days}d ago`;
}
