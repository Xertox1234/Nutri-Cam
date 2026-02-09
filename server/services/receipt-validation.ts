import type { Platform } from "@shared/schemas/subscription";

export interface ReceiptValidationResult {
  valid: boolean;
  productId?: string;
  expiresAt?: Date;
  originalTransactionId?: string;
  errorCode?: string;
}

/**
 * Whether receipt validation is running in stub mode.
 * Stub mode auto-approves all receipts — must NEVER run in production.
 */
const STUB_MODE = !process.env.APPLE_SHARED_SECRET;

/**
 * Validate a purchase receipt from the appropriate platform store.
 *
 * Currently stubbed when APPLE_SHARED_SECRET is not set.
 * Real implementation requires:
 * - Apple: StoreKit 2 / App Store Server API with shared secret
 * - Google: Google Play Developer API with service account credentials
 */
export async function validateReceipt(
  receipt: string,
  platform: Platform,
): Promise<ReceiptValidationResult> {
  if (STUB_MODE) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "Receipt validation is stubbed in production — rejecting. Set APPLE_SHARED_SECRET to enable.",
      );
      return { valid: false, errorCode: "NOT_IMPLEMENTED" };
    }
    console.warn("Receipt validation is stubbed — auto-approving in dev.");
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    return { valid: true, expiresAt };
  }

  if (platform === "ios") {
    return validateAppleReceipt(receipt);
  }
  return validateGoogleReceipt(receipt);
}

// TODO: Implement real Apple receipt validation via App Store Server API
async function validateAppleReceipt(
  _receipt: string,
): Promise<ReceiptValidationResult> {
  return { valid: false, errorCode: "NOT_IMPLEMENTED" };
}

// TODO: Implement real Google receipt validation via Google Play Developer API
async function validateGoogleReceipt(
  _receipt: string,
): Promise<ReceiptValidationResult> {
  return { valid: false, errorCode: "NOT_IMPLEMENTED" };
}
