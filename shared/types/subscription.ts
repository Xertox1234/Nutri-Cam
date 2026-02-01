/**
 * Subscription state types for purchase flow management.
 */

/**
 * Error codes for purchase failures.
 */
export type PurchaseErrorCode =
  | "NETWORK"
  | "STORE_UNAVAILABLE"
  | "ALREADY_OWNED"
  | "USER_CANCELLED"
  | "UNKNOWN";

/**
 * Structured error type for purchase failures.
 */
export interface PurchaseError {
  code: PurchaseErrorCode;
  message: string;
  originalError?: unknown;
}

/**
 * Discriminated union representing all possible purchase states.
 * This enables exhaustive type checking in switch statements.
 */
export type PurchaseState =
  | { status: "idle" }
  | { status: "loading"; productId: string }
  | { status: "pending"; productId: string; transactionId: string }
  | { status: "success"; productId: string; transactionId: string }
  | { status: "cancelled"; productId: string }
  | { status: "restoring" }
  | { status: "error"; error: PurchaseError; productId: string };

/**
 * Transaction record stored in the database.
 */
export interface Transaction {
  id: number;
  userId: number;
  transactionId: string;
  receipt: string;
  platform: "ios" | "android";
  productId: string;
  status: "pending" | "completed" | "refunded" | "failed";
  createdAt: Date;
  updatedAt: Date;
}
