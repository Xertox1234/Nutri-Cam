import crypto from "crypto";
import { z } from "zod";
import type { Platform } from "@shared/schemas/subscription";

export interface ReceiptValidationResult {
  valid: boolean;
  productId?: string;
  expiresAt?: Date;
  originalTransactionId?: string;
  errorCode?: string;
}

// --- Credential detection ---

const HAS_APPLE_CREDENTIALS = !!(
  process.env.APPLE_ISSUER_ID &&
  process.env.APPLE_KEY_ID &&
  process.env.APPLE_PRIVATE_KEY
);

const HAS_GOOGLE_CREDENTIALS = !!(
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
  process.env.GOOGLE_SERVICE_ACCOUNT_KEY
);

/**
 * Stub mode is active when neither platform's credentials are configured.
 * Stub mode auto-approves all receipts — must NEVER run in production.
 */
const STUB_MODE = !HAS_APPLE_CREDENTIALS && !HAS_GOOGLE_CREDENTIALS;

/** Timeout for outbound API requests to Google (10 seconds). */
const FETCH_TIMEOUT_MS = 10_000;

/**
 * Validate a purchase receipt from the appropriate platform store.
 *
 * When credentials are not configured for any platform, falls back to stub mode:
 * - Development: auto-approves with a 1-year expiry
 * - Production: rejects with NOT_IMPLEMENTED
 *
 * When credentials are partially configured (e.g. Apple only), requests for
 * the unconfigured platform return PLATFORM_NOT_CONFIGURED.
 */
export async function validateReceipt(
  receipt: string,
  platform: Platform,
  productId?: string,
): Promise<ReceiptValidationResult> {
  if (STUB_MODE) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "Receipt validation is stubbed in production — rejecting. Configure Apple/Google credentials to enable.",
      );
      return { valid: false, errorCode: "NOT_IMPLEMENTED" };
    }
    console.warn("Receipt validation is stubbed — auto-approving in dev.");
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    return { valid: true, expiresAt };
  }

  if (platform === "ios") {
    if (!HAS_APPLE_CREDENTIALS) {
      return { valid: false, errorCode: "PLATFORM_NOT_CONFIGURED" };
    }
    return validateAppleReceipt(receipt, productId);
  }

  if (!HAS_GOOGLE_CREDENTIALS) {
    return { valid: false, errorCode: "PLATFORM_NOT_CONFIGURED" };
  }
  return validateGoogleReceipt(receipt, productId);
}

// --- Apple App Store Server API v2 ---

/**
 * Decode a base64url-encoded string to a UTF-8 string.
 */
function base64urlDecode(input: string): string {
  const padded = input + "=".repeat((4 - (input.length % 4)) % 4);
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

const appleTransactionSchema = z.object({
  bundleId: z.string().optional(),
  productId: z.string().optional(),
  expiresDate: z.number().optional(),
  originalTransactionId: z.string().optional(),
  revocationDate: z.number().optional(),
});

type AppleTransactionPayload = z.infer<typeof appleTransactionSchema>;

/**
 * Decode the JWS (JSON Web Signature) signed transaction from Apple.
 * The receipt from expo-iap on iOS is a JWS with header.payload.signature format.
 *
 * SECURITY TODO: This decodes the JWS payload but does NOT verify the signature
 * against Apple's root certificate chain (Apple Root CA - G3). A future iteration
 * must verify the x5c certificate chain in the JWS header to prevent forged
 * receipts. Until then, pair this with server-side transaction lookups via the
 * App Store Server API for high-value purchases.
 * See: https://developer.apple.com/documentation/appstoreserverapi/jwstransaction
 */
export function decodeAppleJWS(jws: string): AppleTransactionPayload | null {
  try {
    const parts = jws.split(".");
    if (parts.length !== 3) return null;
    const payloadJson = base64urlDecode(parts[1]);
    const parsed = appleTransactionSchema.safeParse(JSON.parse(payloadJson));
    if (!parsed.success) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

async function validateAppleReceipt(
  receipt: string,
  expectedProductId?: string,
): Promise<ReceiptValidationResult> {
  const payload = decodeAppleJWS(receipt);
  if (!payload) {
    return { valid: false, errorCode: "INVALID_RECEIPT" };
  }

  const expectedBundleId = process.env.APPLE_BUNDLE_ID;
  if (expectedBundleId && payload.bundleId !== expectedBundleId) {
    return { valid: false, errorCode: "BUNDLE_MISMATCH" };
  }

  if (expectedProductId && payload.productId !== expectedProductId) {
    return { valid: false, errorCode: "PRODUCT_MISMATCH" };
  }

  if (payload.revocationDate) {
    return { valid: false, errorCode: "TRANSACTION_REVOKED" };
  }

  if (payload.expiresDate) {
    const expiresAt = new Date(payload.expiresDate);
    if (expiresAt.getTime() < Date.now()) {
      return { valid: false, errorCode: "SUBSCRIPTION_EXPIRED" };
    }
    return {
      valid: true,
      productId: payload.productId,
      expiresAt,
      originalTransactionId: payload.originalTransactionId,
    };
  }

  // Non-subscription purchase (no expiry) — valid
  return {
    valid: true,
    productId: payload.productId,
    originalTransactionId: payload.originalTransactionId,
  };
}

// --- Google Play Developer API v3 ---

/** Module-level cache for the Google OAuth access token. */
let googleAccessToken: string | null = null;
let googleTokenExpiresAt = 0;

const googleOAuthResponseSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
});

const googleSubscriptionResponseSchema = z.object({
  subscriptionState: z.string().optional(),
  lineItems: z
    .array(
      z.object({
        productId: z.string().optional(),
        expiryTime: z.string().optional(),
      }),
    )
    .optional(),
});

/**
 * Build a JWT for Google service account authentication and exchange it
 * for an OAuth2 access token. Caches the token until expiry.
 */
async function getGoogleAccessToken(): Promise<string> {
  if (googleAccessToken && Date.now() < googleTokenExpiresAt) {
    return googleAccessToken;
  }

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
  const privateKeyPem = process.env.GOOGLE_SERVICE_ACCOUNT_KEY!.replace(
    /\\n/g,
    "\n",
  );

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: email,
    scope: "https://www.googleapis.com/auth/androidpublisher",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encode = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url").replace(/=+$/, "");

  const signingInput = `${encode(header)}.${encode(payload)}`;

  const sign = crypto.createSign("RSA-SHA256");
  sign.update(signingInput);
  const signature = sign.sign(privateKeyPem, "base64url").replace(/=+$/, "");

  const jwt = `${signingInput}.${signature}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Google OAuth token exchange failed:", text);
    throw new Error("Failed to obtain Google access token");
  }

  const raw = await response.json();
  const parsed = googleOAuthResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("Unexpected Google OAuth response shape:", parsed.error);
    throw new Error("Invalid Google OAuth response");
  }

  // Cache with 5-minute buffer before actual expiry
  googleAccessToken = parsed.data.access_token;
  googleTokenExpiresAt = Date.now() + (parsed.data.expires_in - 300) * 1000;

  return googleAccessToken;
}

/** Reset the cached Google token (exported for testing). */
export function resetGoogleTokenCache(): void {
  googleAccessToken = null;
  googleTokenExpiresAt = 0;
}

async function validateGoogleReceipt(
  purchaseToken: string,
  expectedProductId?: string,
): Promise<ReceiptValidationResult> {
  const packageName = process.env.GOOGLE_PACKAGE_NAME;
  if (!packageName) {
    return { valid: false, errorCode: "PLATFORM_NOT_CONFIGURED" };
  }

  let accessToken: string;
  try {
    accessToken = await getGoogleAccessToken();
  } catch {
    return { valid: false, errorCode: "STORE_API_ERROR" };
  }

  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Google Play subscription check failed:", text);
    return { valid: false, errorCode: "STORE_API_ERROR" };
  }

  const raw = await response.json();
  const parsed = googleSubscriptionResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("Unexpected Google subscription response:", parsed.error);
    return { valid: false, errorCode: "STORE_API_ERROR" };
  }

  const data = parsed.data;

  const activeStates = [
    "SUBSCRIPTION_STATE_ACTIVE",
    "SUBSCRIPTION_STATE_IN_GRACE_PERIOD",
  ];
  if (
    !data.subscriptionState ||
    !activeStates.includes(data.subscriptionState)
  ) {
    if (data.subscriptionState === "SUBSCRIPTION_STATE_EXPIRED") {
      return { valid: false, errorCode: "SUBSCRIPTION_EXPIRED" };
    }
    return { valid: false, errorCode: "PURCHASE_NOT_ACTIVE" };
  }

  const lineItem = data.lineItems?.[0];
  if (expectedProductId && lineItem?.productId !== expectedProductId) {
    return { valid: false, errorCode: "PRODUCT_MISMATCH" };
  }

  const expiresAt = lineItem?.expiryTime
    ? new Date(lineItem.expiryTime)
    : undefined;

  return {
    valid: true,
    productId: lineItem?.productId,
    expiresAt,
  };
}
