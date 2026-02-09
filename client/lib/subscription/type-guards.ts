import type { PurchaseState } from "@shared/types/subscription";

export function isPurchaseComplete(state: PurchaseState): boolean {
  return state.status === "success";
}

export function isPurchaseInProgress(state: PurchaseState): boolean {
  return (
    state.status === "loading" ||
    state.status === "pending" ||
    state.status === "restoring"
  );
}

export function canInitiatePurchase(state: PurchaseState): boolean {
  return (
    state.status === "idle" ||
    state.status === "cancelled" ||
    state.status === "error"
  );
}
