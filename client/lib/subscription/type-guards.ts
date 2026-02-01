import type { PurchaseState } from "@shared/types/subscription";

/**
 * Type guard to check if a purchase completed successfully.
 */
export function isPurchaseComplete(
  state: PurchaseState,
): state is Extract<PurchaseState, { status: "success" }> {
  return state.status === "success";
}

/**
 * Type guard to check if a purchase is currently in progress.
 * Includes loading, pending, and restoring states.
 */
export function isPurchaseInProgress(
  state: PurchaseState,
): state is Extract<
  PurchaseState,
  { status: "loading" | "pending" | "restoring" }
> {
  return ["loading", "pending", "restoring"].includes(state.status);
}

/**
 * Type guard to check if a purchase ended in an error.
 */
export function isPurchaseError(
  state: PurchaseState,
): state is Extract<PurchaseState, { status: "error" }> {
  return state.status === "error";
}

/**
 * Type guard to check if the user cancelled the purchase.
 */
export function isPurchaseCancelled(
  state: PurchaseState,
): state is Extract<PurchaseState, { status: "cancelled" }> {
  return state.status === "cancelled";
}

/**
 * Check if a new purchase can be initiated from the current state.
 */
export function canInitiatePurchase(state: PurchaseState): boolean {
  return (
    state.status === "idle" ||
    state.status === "cancelled" ||
    state.status === "error"
  );
}
