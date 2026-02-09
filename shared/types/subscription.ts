export interface PurchaseError {
  code:
    | "NETWORK"
    | "STORE_UNAVAILABLE"
    | "ALREADY_OWNED"
    | "USER_CANCELLED"
    | "UNKNOWN";
  message: string;
  originalError?: unknown;
}

export type PurchaseState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "pending" }
  | { status: "success" }
  | { status: "cancelled" }
  | { status: "restoring" }
  | { status: "error"; error: PurchaseError };
