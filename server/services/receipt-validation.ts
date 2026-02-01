/**
 * Receipt validation service for Apple App Store and Google Play.
 *
 * MVP Implementation: Stub validation that accepts all receipts.
 * TODO: Implement real validation with App Store Server API and Google Play Developer API.
 */

export interface ReceiptValidationResult {
  valid: boolean;
  productId?: string;
  expiresAt?: Date;
  originalTransactionId?: string;
  errorCode?: string;
}

/**
 * Validate a receipt from either iOS or Android.
 * MVP: Returns valid for all receipts (stub implementation).
 */
export async function validateReceipt(
  receipt: string,
  platform: "ios" | "android",
): Promise<ReceiptValidationResult> {
  if (platform === "ios") {
    return validateAppleReceipt(receipt);
  }
  return validateGoogleReceipt(receipt);
}

/**
 * Validate Apple App Store receipt.
 *
 * MVP: Stub implementation.
 * TODO: Implement using App Store Server API
 * - Verify JWS signature
 * - Check subscription expiration
 * - Extract originalTransactionId
 *
 * @see https://developer.apple.com/documentation/appstoreserverapi
 */
async function validateAppleReceipt(
  receipt: string,
): Promise<ReceiptValidationResult> {
  // MVP: Accept all receipts with 1 year expiration
  // In production, validate with App Store Server API
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  return {
    valid: true,
    productId: "com.nutriscan.premium.annual",
    expiresAt: oneYearFromNow,
    originalTransactionId: `apple_${Date.now()}`,
  };
}

/**
 * Validate Google Play receipt.
 *
 * MVP: Stub implementation.
 * TODO: Implement using Google Play Developer API
 * - Verify purchase token
 * - Check subscription status
 * - Extract orderId
 *
 * @see https://developer.android.com/google/play/billing/security
 */
async function validateGoogleReceipt(
  receipt: string,
): Promise<ReceiptValidationResult> {
  // MVP: Accept all receipts with 1 year expiration
  // In production, validate with Google Play Developer API
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  return {
    valid: true,
    productId: "com.nutriscan.premium.annual",
    expiresAt: oneYearFromNow,
    originalTransactionId: `google_${Date.now()}`,
  };
}
