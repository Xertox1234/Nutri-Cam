---
title: "feat: Subscription Feature Gating with Native IAP"
type: feat
date: 2026-02-01
deepened: 2026-02-01
---

# feat: Subscription Feature Gating with Native IAP

## Enhancement Summary

**Deepened on:** 2026-02-01
**Reviewed by:** DHH, Kieran (TypeScript), Code Simplicity
**Final approach:** Kieran's rigorous TypeScript patterns with receipt validation

### Key Improvements (Post-Review)

1. **Receipt validation service** - Server-side validation with Apple/Google APIs (required for MVP)
2. **Expanded PurchaseState** - Added `cancelled`, `pending`, `restoring` states
3. **Shared schemas** - Moved Zod schemas to `shared/schemas/subscription.ts`
4. **Query key factory** - Proper TanStack Query key management
5. **Optimistic updates with rollback** - Proper error recovery
6. **Server tests** - Comprehensive endpoint test coverage
7. **Database enums** - Proper PostgreSQL enums instead of text

### Critical Findings

- **SECURITY:** Client-side-only validation is high risk; add receipt validation service
- **YAGNI:** Barcode type restrictions are unused - remove from MVP (keep video flag for upcoming feature)
- **RACE CONDITIONS:** Purchase flow needs state machine to prevent double-purchases

### Post-Review Decisions

- **Remove content teasers** - No blur overlays or GatedContent component
- **Keep video flag** - Video feature is forthcoming
- **Use expo-iap directly** - No RevenueCat
- **Add receipt validation** - Per Kieran's security recommendation

---

## Overview

Implement a complete subscription system that differentiates free and premium users through soft feature gates. Free users get limited functionality (3 daily scans, barcode only, content teasers) with upgrade prompts. Premium users get unlimited access to all features. Payment handled natively through App Store / Play Store via `expo-iap` with annual subscription pricing and a 3-day free trial.

## Problem Statement / Motivation

The app currently has subscription infrastructure (tiers, hooks, feature flags) but no actual paywall or payment integration. This leaves:

- No revenue generation capability
- No clear premium value proposition for users
- Unused feature gating code
- TODO comments for upgrade modals that don't exist

**Goal:** Premium differentiation - create a compelling premium experience that incentivizes upgrades while keeping the free tier useful.

## Proposed Solution

### Tier Structure (Final)

| Feature         | Free  | Premium         |
| --------------- | ----- | --------------- |
| Daily scans     | **3** | Unlimited       |
| Video recording | -     | ✓ (forthcoming) |
| Free trial      | -     | 3-day trial     |
| Price           | $0    | $X.XX/year      |

**Simplifications applied:**

- Removed barcode type gating (all types free)
- Removed content teasers (no blur/lock overlays)
- Kept video flag for upcoming feature

### Soft Gate UX

1. **Scan Limit Gate:** 4th scan attempt shows upgrade modal (non-blocking, can dismiss)
2. **Profile Upgrade:** Prominent upgrade button in Profile screen

### Upgrade Modal

- Full-screen modal with benefits list
- "Start 3-Day Free Trial" CTA
- "Restore Purchases" link
- Native IAP sheet integration

#### Research Insights: Modal Design Patterns

**Visual Design (frontend-design, interaction-design):**

- Use violet premium accent color (`#8B5CF6`) for premium branding
- Implement blur overlay behind modal for focus
- Add visual trial timeline showing 3 days free → then billed
- Use price anchoring: show monthly equivalent below annual price

**Animation Patterns (react-native-design):**

```typescript
// Reanimated 4 spring config for modal
const modalConfig = {
  damping: 20,
  stiffness: 300,
  mass: 0.8,
};

// Entry animation with useAnimatedStyle
const animatedStyle = useAnimatedStyle(() => ({
  opacity: withSpring(isVisible ? 1 : 0, modalConfig),
  transform: [{ translateY: withSpring(isVisible ? 0 : 100, modalConfig) }],
}));
```

**Accessibility Requirements (accessibility-compliance):**

- Focus trap: Modal must trap focus when open
- First focusable element: CTA button on open
- Close on Escape key press
- Minimum 44x44pt touch targets for all buttons
- Screen reader: Announce as "dialog" with descriptive label
- Reduced motion: Skip animations when `AccessibilityInfo.isReduceMotionEnabled`

**Microinteractions (interaction-design):**

- Haptic feedback: `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` on CTA tap
- Loading state: Spinner with "Processing..." text during purchase
- Success state: Checkmark animation + confetti (optional)
- Error state: Shake animation + red error message

**iOS HIG Compliance (mobile-ios-design):**

- Use `presentationStyle: 'pageSheet'` for native feel
- Include "Restore Purchases" prominently (App Store requirement)
- Show subscription terms near CTA (auto-renewal disclosure)

### Subscription Management

- New section in Profile screen after "Nutrition Goals"
- Shows: current tier badge, expiration date (if premium), manage button
- Links to native App Store/Play Store subscription management

## Technical Considerations

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client                                │
├─────────────────────────────────────────────────────────────┤
│  UpgradeModal.tsx          │  expo-iap                      │
│  (triggers purchase)       │  (handles native IAP)          │
│           ↓                │           ↓                    │
│  PremiumContext.tsx        │  App Store / Play Store        │
│  (manages subscription     │  (processes payment)           │
│   state via TanStack Query)│           ↓                    │
│           ↓                │  Receipt                       │
└───────────┬────────────────┴───────────┬────────────────────┘
            │                            │
            ▼                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        Server                                │
├─────────────────────────────────────────────────────────────┤
│  POST /api/subscription/upgrade                              │
│  POST /api/subscription/restore                              │
│  GET  /api/subscription/status (existing)                    │
│           ↓                                                  │
│  storage.ts → users table                                    │
│  (subscriptionTier, subscriptionExpiresAt)                   │
└─────────────────────────────────────────────────────────────┘
```

### expo-iap Integration

- Requires **custom dev client** (cannot test in Expo Go)
- Use `useIAP` hook for purchase flow
- **Must call `finishTransaction()`** after every purchase (per learnings doc)
- Handle `E_USER_CANCELLED` silently (intentional, not error)
- Implement restore purchases flow (required for App Store approval)

#### Research Insights: expo-iap Best Practices (2025-2026)

**Provider Setup (framework-docs-researcher):**

```typescript
// App.tsx - Wrap entire app
import { IAPProvider } from 'expo-iap';

export default function App() {
  return (
    <IAPProvider>
      <NavigationContainer>
        {/* ... */}
      </NavigationContainer>
    </IAPProvider>
  );
}
```

**Purchase Flow Pattern:**

```typescript
import { useIAP, requestPurchase, finishTransaction } from "expo-iap";

const { connected, products, currentPurchase } = useIAP();

// 1. Get products on mount
useEffect(() => {
  if (connected) {
    getProducts({ productIds: ["com.nutriscan.premium.annual"] });
  }
}, [connected]);

// 2. Handle purchase completion - CRITICAL: always finishTransaction
useEffect(() => {
  if (currentPurchase) {
    const receipt = currentPurchase.transactionReceipt;
    if (receipt) {
      // Send to server, then finish
      finishTransaction({
        purchase: currentPurchase,
        isConsumable: false,
      }).then(() => refreshSubscription());
    }
  }
}, [currentPurchase]);

// 3. Initiate purchase (platform-specific in v2.7.0+)
const handlePurchase = async () => {
  const product = products[0];
  if (Platform.OS === "ios") {
    await requestPurchase({ sku: product.productId });
  } else {
    await requestPurchase({
      skus: [product.productId],
      obfuscatedAccountIdAndroid: userId, // for Google Play
    });
  }
};
```

**StoreKit 2 Note (iOS 15+):**

- Receipts are now JWS (JSON Web Signature) tokens, not base64
- Use App Store Server API for server-side validation
- `originalTransactionId` is the key identifier for subscriptions

**Error Handling:**

```typescript
const ERROR_CODES_SILENT = [
  "E_USER_CANCELLED",
  "E_ITEM_UNAVAILABLE", // product not configured yet
];

try {
  await requestPurchase({ sku });
} catch (error) {
  if (!ERROR_CODES_SILENT.includes(error.code)) {
    // Show error to user
    Alert.alert("Purchase Failed", error.message);
  }
}
```

### State Management

- Use existing `PremiumContext` for subscription state
- Call `refreshSubscription()` after successful purchase
- Optimistic update: unlock features immediately, sync server async
- Handle stale state with 5-min staleTime for status, 30-sec for scan count

**Query Key Factory (per Kieran):**

```typescript
// client/lib/subscription/query-keys.ts

export const subscriptionKeys = {
  all: ["subscription"] as const,
  status: () => [...subscriptionKeys.all, "status"] as const,
  scanCount: () => [...subscriptionKeys.all, "scanCount"] as const,
  products: () => [...subscriptionKeys.all, "products"] as const,
};
```

**Optimistic Update with Rollback (per Kieran):**

```typescript
// client/hooks/useUpgrade.ts

export function useUpgrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpgradeRequest) => {
      const response = await apiRequest<UpgradeResponse>(
        "/api/subscription/upgrade",
        {
          method: "POST",
          body: JSON.stringify(params),
        },
      );
      return response;
    },
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: subscriptionKeys.status() });

      // Snapshot previous value for rollback
      const previousStatus = queryClient.getQueryData(
        subscriptionKeys.status(),
      );

      // Optimistically update
      queryClient.setQueryData(subscriptionKeys.status(), {
        tier: "premium",
        isPremium: true,
      });

      return { previousStatus };
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousStatus) {
        queryClient.setQueryData(
          subscriptionKeys.status(),
          context.previousStatus,
        );
      }
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.status() });
    },
  });
}
```

#### Research Insights: Race Condition Prevention (julik-frontend-races-reviewer)

**5 Race Conditions Identified:**

1. **Multiple Modal Triggers**
   - Problem: Rapid taps on gated content open multiple modals
   - Solution: Use ref-based guard, not state

   ```typescript
   const isModalOpenRef = useRef(false);

   const triggerUpgrade = useCallback(() => {
     if (isModalOpenRef.current) return; // Synchronous check
     isModalOpenRef.current = true;
     setModalVisible(true);
   }, []);
   ```

2. **Purchase/State Sync Race**
   - Problem: `currentPurchase` effect runs before server confirms
   - Solution: Optimistic update + server reconciliation

   ```typescript
   // Optimistic: unlock immediately
   queryClient.setQueryData(["subscription", "status"], { tier: "premium" });
   // Server: confirm async (will correct if failed)
   await api.post("/subscription/upgrade", { receipt });
   ```

3. **Stale Closure in Purchase Callback**
   - Problem: Callback captures old state values
   - Solution: Use refs for values needed in async callbacks

   ```typescript
   const userIdRef = useRef(userId);
   useEffect(() => {
     userIdRef.current = userId;
   }, [userId]);

   const handlePurchase = useCallback(async () => {
     await api.post("/upgrade", { userId: userIdRef.current });
   }, []); // No userId dependency - ref always current
   ```

4. **Concurrent Scan Attempts**
   - Problem: User taps scan rapidly, multiple requests sent
   - Solution: Abort controller + debounce

   ```typescript
   const abortRef = useRef<AbortController>();

   const handleScan = async (barcode: string) => {
     abortRef.current?.abort();
     abortRef.current = new AbortController();
     await api.post("/scan", { barcode }, { signal: abortRef.current.signal });
   };
   ```

5. **Navigation During Purchase**
   - Problem: User navigates away mid-purchase, callback runs on unmounted
   - Solution: Mounted ref guard

   ```typescript
   const isMounted = useRef(true);
   useEffect(
     () => () => {
       isMounted.current = false;
     },
     [],
   );

   const onPurchaseComplete = () => {
     if (!isMounted.current) return;
     setSuccess(true);
   };
   ```

**TypeScript Pattern for Purchase State (Kieran review - expanded):**

```typescript
// shared/types/subscription.ts

// Separate error type for better error handling
interface PurchaseError {
  code:
    | "NETWORK"
    | "STORE_UNAVAILABLE"
    | "ALREADY_OWNED"
    | "USER_CANCELLED"
    | "UNKNOWN";
  message: string;
  originalError?: unknown;
}

// Discriminated union with ALL states (per Kieran review)
type PurchaseState =
  | { status: "idle" }
  | { status: "loading"; productId: string }
  | { status: "pending"; productId: string; transactionId: string }
  | { status: "success"; productId: string; transactionId: string }
  | { status: "cancelled"; productId: string }
  | { status: "restoring" }
  | { status: "error"; error: PurchaseError; productId: string };

// client/lib/subscription/type-guards.ts

export function isPurchaseComplete(
  state: PurchaseState,
): state is Extract<PurchaseState, { status: "success" }> {
  return state.status === "success";
}

export function isPurchaseInProgress(
  state: PurchaseState,
): state is Extract<
  PurchaseState,
  { status: "loading" | "pending" | "restoring" }
> {
  return ["loading", "pending", "restoring"].includes(state.status);
}

export function canInitiatePurchase(state: PurchaseState): boolean {
  return (
    state.status === "idle" ||
    state.status === "cancelled" ||
    state.status === "error"
  );
}
```

### Validation

- **MVP:** Client-side validation only (accepts security risk)
- **Future:** Add server-side receipt validation
- Use Zod `safeParse()` for tier validation (per learnings doc, never use `as` cast)

#### Research Insights: Security Analysis (security-sentinel)

**⚠️ CRITICAL SECURITY FINDING:**

Client-side-only validation is **HIGH RISK** even for MVP:

- Users can modify local storage to set `tier: 'premium'`
- Receipt sharing between devices bypasses payment
- Jailbroken devices can patch app binary

**Minimum Viable Security (Recommended for MVP):**

```typescript
// Server: Store receipt even without full validation
app.post("/api/subscription/upgrade", async (req, res) => {
  const { userId, receipt, platform } = req.body;

  // 1. Store receipt (audit trail)
  await db.insert(transactions).values({
    userId,
    receipt,
    platform,
    createdAt: new Date(),
    status: "pending_validation",
  });

  // 2. Optimistically upgrade (validate async later)
  await db
    .update(users)
    .set({
      subscriptionTier: "premium",
      subscriptionExpiresAt: addYears(new Date(), 1),
    })
    .where(eq(users.id, userId));

  res.json({ success: true });
});
```

**Why This Helps:**

- Receipt storage enables retroactive validation
- Can detect fraudulent patterns (same receipt, multiple users)
- Audit trail for App Store disputes
- Easy to add full validation later without schema changes

**Receipt Validation Service (Kieran review - required for MVP):**

```typescript
// server/services/receipt-validation.ts

interface ReceiptValidationResult {
  valid: boolean;
  productId?: string;
  expiresAt?: Date;
  originalTransactionId?: string;
  errorCode?: string;
}

export async function validateReceipt(
  receipt: string,
  platform: "ios" | "android",
): Promise<ReceiptValidationResult> {
  if (platform === "ios") {
    return validateAppleReceipt(receipt);
  }
  return validateGoogleReceipt(receipt);
}

async function validateAppleReceipt(
  receipt: string,
): Promise<ReceiptValidationResult> {
  // StoreKit 2: JWS token validation
  // Use App Store Server API: https://developer.apple.com/documentation/appstoreserverapi
  // Verify signature, check expiration, extract originalTransactionId
}

async function validateGoogleReceipt(
  receipt: string,
): Promise<ReceiptValidationResult> {
  // Google Play Developer API
  // https://developer.android.com/google/play/billing/security
}
```

**Zod Schema Pattern (typescript-advanced-types):**

```typescript
import { z } from "zod";

const SubscriptionTierSchema = z.enum(["free", "premium"]);

// NEVER use `as SubscriptionTier` - use safeParse
const result = SubscriptionTierSchema.safeParse(response.tier);
if (result.success) {
  setTier(result.data);
} else {
  console.error("Invalid tier from server:", response.tier);
  setTier("free"); // Safe fallback
}
```

### Cleanup Pattern (per learnings doc)

```typescript
// For any timers in upgrade modal
useEffect(() => {
  return () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };
}, []);
```

## Acceptance Criteria

### Tier Configuration

- [x] Update `TIER_FEATURES.free.maxDailyScans` from 10 to 3 in `shared/types/premium.ts`
- [x] Remove barcode type gating (all types free)
- [x] Keep `videoRecording` flag for upcoming feature

### Shared Schemas (per Kieran)

- [x] Create `shared/schemas/subscription.ts` with `UpgradeRequestSchema`, `UpgradeResponseSchema`
- [x] Create `shared/types/subscription.ts` with `PurchaseState`, `PurchaseError` types
- [x] Create `client/lib/subscription/type-guards.ts` with type guard functions
- [x] Create `client/lib/subscription/query-keys.ts` with query key factory

### Upgrade Modal

- [x] Create `UpgradeModal.tsx` component in `client/components/`
- [x] Display benefits list matching tier features
- [x] "Start 3-Day Free Trial" primary CTA
- [x] "Restore Purchases" secondary link
- [x] Accessible: proper focus management, screen reader labels
- [x] Haptic feedback on CTA tap
- [x] Reduced motion support for animations

### Scan Limit Gate

- [x] Wire upgrade modal to `ScanScreen.tsx` (replace TODO at line 199)
- [x] 4th scan attempt triggers modal
- [x] Modal is dismissible (soft gate)
- [x] Show remaining scan count in UI

### expo-iap Integration

- [ ] Install and configure `expo-iap`
- [ ] Configure annual subscription product (SKU TBD)
- [ ] Configure 3-day free trial in App Store Connect / Play Console
- [ ] Implement purchase flow with `useIAP` hook
- [ ] Call `finishTransaction()` after every purchase
- [ ] Handle all error codes appropriately
- [ ] Implement restore purchases flow

### Server Endpoints

- [x] Create `server/lib/api-errors.ts` with `sendError()` helper
- [x] Create `server/services/receipt-validation.ts` with Apple/Google validation
- [x] Create `POST /api/subscription/upgrade` - validate receipt, store transaction, update tier
- [x] Create `POST /api/subscription/restore` - validate restored purchases, sync tier
- [x] Use shared Zod schemas from `@shared/schemas/subscription`

#### Research Insights: Backend Implementation (Kieran review - with validation)

**Shared Schemas (per Kieran - schemas must be in shared/):**

```typescript
// shared/schemas/subscription.ts

import { z } from "zod";

export const PlatformSchema = z.enum(["ios", "android"]);
export type Platform = z.infer<typeof PlatformSchema>;

export const UpgradeRequestSchema = z.object({
  receipt: z.string().min(1, "Receipt is required"),
  platform: PlatformSchema,
  productId: z.string().min(1, "Product ID is required"),
  transactionId: z.string().min(1, "Transaction ID is required"),
});
export type UpgradeRequest = z.infer<typeof UpgradeRequestSchema>;

export const UpgradeResponseSchema = z.discriminatedUnion("success", [
  z.object({
    success: z.literal(true),
    tier: z.enum(["free", "premium"]),
    expiresAt: z.string().datetime(),
  }),
  z.object({
    success: z.literal(false),
    error: z.string(),
    code: z
      .enum([
        "INVALID_RECEIPT",
        "ALREADY_PROCESSED",
        "VALIDATION_ERROR",
        "SERVER_ERROR",
      ])
      .optional(),
  }),
]);
export type UpgradeResponse = z.infer<typeof UpgradeResponseSchema>;
```

**Consistent Error Responses (per Kieran):**

```typescript
// server/lib/api-errors.ts

interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

export function sendError(
  res: Response,
  status: number,
  error: string,
  options?: { code?: string; details?: unknown },
): void {
  res.status(status).json({ success: false, error, ...options });
}
```

**Endpoint with Receipt Validation:**

```typescript
// server/routes/subscription.ts

import { UpgradeRequestSchema } from "@shared/schemas/subscription";
import { validateReceipt } from "../services/receipt-validation";
import { sendError } from "../lib/api-errors";

app.post("/api/subscription/upgrade", requireAuth, async (req, res) => {
  const parseResult = UpgradeRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return sendError(res, 400, "Invalid request", {
      code: "VALIDATION_ERROR",
      details: parseResult.error.flatten(),
    });
  }

  const { receipt, platform, productId, transactionId } = parseResult.data;
  const userId = req.user.id;

  try {
    // 1. Check for duplicate transaction (idempotency)
    const existing = await storage.getTransaction(transactionId);
    if (existing) {
      return res.json({ success: true, message: "Already processed" });
    }

    // 2. Validate receipt with Apple/Google (per Kieran - required)
    const validation = await validateReceipt(receipt, platform);
    if (!validation.valid) {
      return sendError(res, 400, "Invalid receipt", {
        code: "INVALID_RECEIPT",
      });
    }

    // 3. Store transaction
    await storage.createTransaction({
      userId,
      transactionId,
      receipt,
      platform,
      productId,
      status: "completed",
    });

    // 4. Upgrade user
    const expiresAt =
      validation.expiresAt ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    await storage.updateUser(userId, {
      subscriptionTier: "premium",
      subscriptionExpiresAt: expiresAt,
    });

    res.json({
      success: true,
      tier: "premium",
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Upgrade failed:", error);
    sendError(res, 500, "Upgrade failed", { code: "SERVER_ERROR" });
  }
});
```

**Database Schema Addition (Kieran review - use enums, add indexes):** ✅ IMPLEMENTED

```typescript
// shared/schema.ts - Add transactions table with proper enums

export const platformEnum = pgEnum("platform", ["ios", "android"]);
export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending",
  "completed",
  "refunded",
  "failed",
]);

export const transactions = pgTable(
  "transactions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    transactionId: text("transaction_id").notNull().unique(),
    receipt: text("receipt").notNull(),
    platform: platformEnum("platform").notNull(),
    productId: text("product_id").notNull(),
    status: transactionStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("transactions_user_id_idx").on(table.userId),
    statusIdx: index("transactions_status_idx").on(table.status),
  }),
);
```

### Profile Screen

- [x] Add subscription section after "Nutrition Goals"
- [x] Show current tier badge
- [x] Show expiration date for premium users
- [x] "Upgrade" button for free users
- [x] "Manage Subscription" button for premium users (links to native settings)
- [x] "Restore Purchases" button

### Testing

- [ ] Create custom dev client with `eas build --profile development`
- [ ] Configure sandbox testing for iOS and Android
- [ ] Test: new free user sees 3-scan limit
- [ ] Test: 4th scan triggers upgrade modal
- [ ] Test: purchase completes and unlocks features
- [ ] Test: restore purchases works
- [ ] Test: trial converts to paid after 3 days (sandbox accelerated)
- [x] Server tests: `server/__tests__/subscription.test.ts` (16 tests)
- [x] Client tests: `client/components/__tests__/UpgradeModal.test.ts` (12 tests)
- [x] Schema tests: `shared/schemas/__tests__/subscription.test.ts` (21 tests)
- [x] Type guard tests: `client/lib/subscription/__tests__/type-guards.test.ts` (15 tests)
- [x] Query key tests: `client/lib/subscription/__tests__/query-keys.test.ts` (8 tests)
- [x] Subscription types tests: `shared/__tests__/subscription-types.test.ts` (10 tests)

#### Research Insights: Testing Patterns (javascript-testing-patterns)

**Mocking expo-iap:**

```typescript
// __mocks__/expo-iap.ts
export const useIAP = vi.fn(() => ({
  connected: true,
  products: [
    {
      productId: "com.nutriscan.premium.annual",
      title: "Premium Annual",
      price: "$29.99",
      localizedPrice: "$29.99",
    },
  ],
  currentPurchase: null,
  purchaseHistory: [],
}));

export const requestPurchase = vi.fn();
export const finishTransaction = vi.fn();
export const getProducts = vi.fn();
```

**Test Fixtures:**

```typescript
// __fixtures__/subscription.ts
export const freeTierUser = {
  id: 1,
  subscriptionTier: "free",
  subscriptionExpiresAt: null,
};

export const premiumUser = {
  id: 2,
  subscriptionTier: "premium",
  subscriptionExpiresAt: new Date("2027-02-01"),
};

export const mockPurchase = {
  transactionId: "txn_123",
  transactionReceipt: "mock_receipt_data",
  productId: "com.nutriscan.premium.annual",
};
```

**Component Test with TanStack Query:**

```typescript
import { renderWithProviders } from '../test-utils';
import { UpgradeModal } from '../UpgradeModal';

describe('UpgradeModal', () => {
  it('shows loading state during purchase', async () => {
    const { getByText, getByTestId } = renderWithProviders(
      <UpgradeModal visible onClose={vi.fn()} />
    );

    fireEvent.press(getByText('Start 3-Day Free Trial'));

    expect(getByTestId('purchase-loading')).toBeTruthy();
  });

  it('closes on successful purchase', async () => {
    const onClose = vi.fn();
    // Mock successful purchase
    vi.mocked(useIAP).mockReturnValue({
      ...useIAP(),
      currentPurchase: mockPurchase,
    });

    renderWithProviders(<UpgradeModal visible onClose={onClose} />);

    await waitFor(() => {
      expect(finishTransaction).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });
});
```

**Server Tests (per Kieran - required):**

```typescript
// server/__tests__/routes/subscription.test.ts

describe("POST /api/subscription/upgrade", () => {
  it("rejects invalid receipt format", async () => {
    const response = await request(app)
      .post("/api/subscription/upgrade")
      .set("Authorization", `Bearer ${validToken}`)
      .send({
        receipt: "",
        platform: "ios",
        productId: "com.nutriscan.premium",
        transactionId: "txn_123",
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });

  it("handles duplicate transaction idempotently", async () => {
    const payload = {
      receipt: "valid_receipt",
      platform: "ios",
      productId: "com.nutriscan.premium",
      transactionId: "txn_duplicate",
    };

    // First request
    await request(app)
      .post("/api/subscription/upgrade")
      .set("Authorization", `Bearer ${validToken}`)
      .send(payload);

    // Second request with same transactionId
    const response = await request(app)
      .post("/api/subscription/upgrade")
      .set("Authorization", `Bearer ${validToken}`)
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it("rejects invalid receipts", async () => {
    vi.mocked(validateReceipt).mockResolvedValueOnce({
      valid: false,
      errorCode: "INVALID",
    });

    const response = await request(app)
      .post("/api/subscription/upgrade")
      .set("Authorization", `Bearer ${validToken}`)
      .send(validPayload);

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("INVALID_RECEIPT");
  });

  it("rejects requests without authentication", async () => {
    const response = await request(app)
      .post("/api/subscription/upgrade")
      .send(validPayload);

    expect(response.status).toBe(401);
  });
});
```

## Success Metrics

- **Conversion rate:** % of free users who upgrade
- **Trial-to-paid:** % of trial users who convert
- **Gate encounters:** How often users hit scan limits or content gates
- **Restore success:** % of restore attempts that succeed

## Dependencies & Risks

### Dependencies

| Dependency                       | Status      | Blocker?          |
| -------------------------------- | ----------- | ----------------- |
| expo-iap installation            | Not started | Yes               |
| Custom dev client                | Not started | Yes (for testing) |
| App Store Connect product config | Not started | Yes               |
| Play Console product config      | Not started | Yes               |
| Annual price point decision      | **Open**    | Yes               |
| Product SKU naming               | **Open**    | Yes               |

### Risks

| Risk                                  | Mitigation                                            |
| ------------------------------------- | ----------------------------------------------------- |
| App Store rejection (missing restore) | Implement restore purchases prominently               |
| expo-iap breaking changes             | Pin version, test thoroughly                          |
| Client-side validation bypass         | Accept for MVP, add server validation later           |
| Network failure during purchase       | Retry with exponential backoff, persist pending state |
| finishTransaction failure             | Log error, retry on next app launch                   |
| Subscription expiration handling      | Check expiration server-side, downgrade immediately   |

## References & Research

### Internal References

- Brainstorm: `docs/brainstorms/2026-02-01-subscription-feature-gating-brainstorm.md`
- Tier definitions: `shared/types/premium.ts:1-38`
- Premium context: `client/context/PremiumContext.tsx:1-114`
- Feature hooks: `client/hooks/usePremiumFeatures.ts:1-99`
- Scan screen TODO: `client/screens/ScanScreen.tsx:199`
- Profile insertion point: `client/screens/ProfileScreen.tsx:387`
- Server routes: `server/routes.ts:498-549`
- Zod validation pattern: `docs/solutions/runtime-errors/unsafe-type-cast-zod-validation.md`
- Cleanup pattern: `docs/solutions/logic-errors/useeffect-cleanup-memory-leak.md`

### External References

- expo-iap docs: https://hyochan.github.io/expo-iap
- App Store Server API: https://developer.apple.com/documentation/appstoreserverapi
- Google Play Billing: https://developer.android.com/google/play/billing

### Open Items (Requires Product Decision)

- [ ] Annual subscription price point
- [ ] Product SKU naming convention
- [ ] Upgrade modal copy and visual design

---

## Architecture Review (architecture-strategist)

### Current State Analysis

**Strengths:**

- Existing `PremiumContext` provides solid foundation
- TanStack Query already configured for subscription status
- Feature hooks (`usePremiumFeatures`) encapsulate gating logic

**Gaps Identified:**

1. **Missing mutation support** - No `useMutation` for purchase flow
2. **No purchase state machine** - Risk of invalid states during purchase
3. **No transaction table** - Can't audit or reconcile purchases
4. **Computed features on client** - Should be server-authoritative

### Recommended Architecture Enhancements

```
┌─────────────────────────────────────────────────────────────┐
│                        Client                                │
├─────────────────────────────────────────────────────────────┤
│  UpgradeModal.tsx          │  usePurchase() hook            │
│  (UI only)                 │  (purchase state machine)      │
│           ↓                │           ↓                    │
│  PremiumContext.tsx        │  expo-iap                      │
│  + useMutation for         │  (handles native IAP)          │
│    upgrade/restore         │           ↓                    │
│           ↓                │  Receipt                       │
└───────────┬────────────────┴───────────┬────────────────────┘
            │                            │
            ▼                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        Server                                │
├─────────────────────────────────────────────────────────────┤
│  POST /api/subscription/upgrade                              │
│  POST /api/subscription/restore                              │
│  GET  /api/subscription/status                               │
│  GET  /api/subscription/features  ← NEW: computed features   │
│           ↓                                                  │
│  transactions table (NEW)  │  users table                   │
│  (receipt audit trail)     │  (tier, expiresAt)             │
└─────────────────────────────────────────────────────────────┘
```

### Agent-Native Considerations (agent-native-reviewer)

**Issue:** Features computed client-side can't be queried by agents.

**Solution:** Add server endpoint for computed features:

```typescript
GET /api/subscription/features
Response: {
  canScanToday: true,
  remainingScans: 2,
  tier: 'free',
  isTrialing: false,
  gatedFeatures: ['unlimitedScans', 'fullRecipes']
}
```

This enables agents to check feature availability programmatically.

---

## Pattern Consistency (pattern-recognition-specialist)

### Existing Patterns to Follow

1. **Modal Pattern** - Use `ErrorFallback` modal as reference (`client/components/ErrorFallback.tsx`)
2. **Context Pattern** - Follow `AuthContext` structure for mutations
3. **Hook Pattern** - Follow `useAuth()` for `usePurchase()` hook
4. **Safe Area Pattern** - Already documented in `PATTERNS.md`
5. **Haptic Pattern** - Already documented in `PATTERNS.md`

### Anti-Patterns to Avoid

- ❌ Don't duplicate tier logic across components (use hooks)
- ❌ Don't store receipt in AsyncStorage (use server)
- ❌ Don't use `as SubscriptionTier` casts (use Zod)
- ❌ Don't show upgrade modal on every gated tap (debounce with ref)
