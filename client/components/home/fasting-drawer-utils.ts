import { formatDuration } from "@/lib/format";
import type { ApiFastingLog, FastingStats } from "@shared/types/fasting";

export function formatFastingSubtitle(
  isFasting: boolean,
  elapsedMinutes: number,
  targetHours: number | undefined,
  scheduleProtocol?: string,
): string {
  if (isFasting) {
    const progress = computeFastProgress(elapsedMinutes, targetHours ?? 16);
    const pct = Math.round(Math.min(1, progress) * 100);
    return `● ${formatDuration(elapsedMinutes)} · ${pct}%`;
  }
  if (scheduleProtocol) {
    return `${scheduleProtocol} scheduled`;
  }
  return "Start your first fast";
}

export function formatTimeToGoal(
  elapsedMinutes: number,
  targetHours: number,
): string {
  const targetMinutes = targetHours * 60;
  if (elapsedMinutes >= targetMinutes) return "Goal reached!";
  return formatDuration(targetMinutes - elapsedMinutes);
}

export function formatStartedAt(startedAt: string): string {
  const d = new Date(startedAt);
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

export function formatLastFastDuration(logs: ApiFastingLog[]): string {
  const minutes = logs[0]?.actualDurationMinutes;
  if (minutes == null) return "—";
  return formatDuration(minutes);
}

export function formatCompletionRate(stats: FastingStats | undefined): string {
  if (!stats || stats.totalFasts === 0) return "—";
  return `${Math.round(stats.completionRate * 100)}%`;
}

export function computeFastProgress(
  elapsedMinutes: number,
  targetHours: number,
): number {
  if (targetHours <= 0) return 0;
  return Math.min(1, elapsedMinutes / (targetHours * 60));
}
