import type { PurchaseState } from "@shared/types/subscription";

/** Benefit items displayed in the upgrade modal. */
export const BENEFITS = [
  { icon: "zap" as const, label: "Unlimited daily scans" },
  { icon: "bar-chart-2" as const, label: "Detailed macro goals" },
  { icon: "book-open" as const, label: "AI recipe generation" },
  { icon: "camera" as const, label: "High quality photo capture" },
];

/** Returns the CTA button label based on purchase state. */
export function getCtaLabel(status: PurchaseState["status"]): string {
  switch (status) {
    case "loading":
    case "pending":
      return "Processing...";
    case "restoring":
      return "Restoring...";
    case "success":
      return "Welcome to Premium!";
    default:
      return "Start 3-Day Free Trial";
  }
}

/** Returns whether the CTA button should be disabled. */
export function isCtaDisabled(status: PurchaseState["status"]): boolean {
  return (
    status === "loading" ||
    status === "pending" ||
    status === "restoring" ||
    status === "success"
  );
}
