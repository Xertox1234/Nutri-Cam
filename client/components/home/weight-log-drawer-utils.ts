import type { ApiWeightLog, WeightTrend } from "@shared/types/weight";

export function formatWeightSubtitle(
  logs: ApiWeightLog[],
  trend: Pick<WeightTrend, "weeklyRateOfChange"> | null | undefined,
  justLogged: boolean,
  justLoggedWeight: number | undefined,
): string {
  if (justLogged && justLoggedWeight !== undefined) {
    return `✓ Logged ${justLoggedWeight.toFixed(1)} kg`;
  }
  if (logs.length === 0) {
    return "Log your first weight";
  }
  const last = parseFloat(logs[0].weight);
  const rate = trend?.weeklyRateOfChange;
  if (rate != null && rate !== 0) {
    const delta = formatWeightDelta(rate);
    return `${last.toFixed(1)} kg · ${delta} kg/wk`;
  }
  return `${last.toFixed(1)} kg`;
}

export function formatWeightDelta(
  weeklyRate: number | null | undefined,
): string {
  if (weeklyRate == null || weeklyRate === 0) return "—";
  const abs = Math.abs(weeklyRate).toFixed(1);
  return weeklyRate < 0 ? `▼ ${abs}` : `▲ ${abs}`;
}

export function computeGoalProgress(
  currentWeight: number | null | undefined,
  goalWeight: number | null | undefined,
  startWeight: number | null | undefined,
): number {
  if (currentWeight == null || goalWeight == null || startWeight == null) {
    return 0;
  }
  const range = startWeight - goalWeight;
  if (range === 0) return 0;
  const made = startWeight - currentWeight;
  return Math.min(1, Math.max(0, made / range));
}

export function formatGoalLabel(
  currentWeight: number,
  goalWeight: number,
): string {
  const remaining = Math.abs(currentWeight - goalWeight);
  if (remaining < 0.05) return "Goal reached!";
  return `${remaining.toFixed(1)} kg to goal`;
}
