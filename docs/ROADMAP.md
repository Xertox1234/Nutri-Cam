# OCRecipes Roadmap

Last updated: 2026-03-20

## Shipped

### Smart Scan (Phase 1) — PR #14

Auto-classification replaces manual intent selection. Users take a photo, Vision API classifies what it is (meal, label, menu, receipt, barcode), and auto-routes to the correct screen. PhotoIntentScreen kept as fallback for low-confidence results.

### Verified Product Data Collection (Phase 2a) — PRs #15-20

Barcode verification pipeline. Users scan barcodes then verify nutrition by scanning labels. 3 independent matching verifications (5% tolerance on calories/protein/carbs/fat) mark a product as "verified." Community-shared data stored permanently in `barcodeVerifications` + `verificationHistory` tables.

Includes:

- Verification comparison service with consensus model
- `POST /api/verification/submit` + `GET /api/verification/:barcode` endpoints
- VerificationBadge component on NutritionDetailScreen
- LabelAnalysisScreen verification mode
- ProfileScreen: real verification count, streak tracking, badge tiers (Newcomer → Platinum)
- Security: cache poisoning prevention, magic-byte validation, label session caps

### Security Fixes — PR #14

- Cache poisoning: `cacheNutritionIfAbsent` prevents overwriting existing entries
- Magic-byte validation on all photo upload endpoints
- Label session store bounded capacity (per-user + global caps)

### Front-of-Package Label Scanning — PR #21

Optional enrichment step after back-label verification. Users scan the front of a product package to capture brand, product name, net weight, and dietary/marketing claims (e.g., "No Added Sugar", "Keto Friendly", "Gluten Free").

Includes:

- `front-label-analysis.ts` Vision API service (detail: "low" for cost efficiency)
- `POST /api/verification/front-label` + `POST /api/verification/front-label/confirm` endpoints
- FrontLabelConfirmScreen with extracted data review + "Looks Good" / "Retake"
- ScanScreen front-label mode, LabelAnalysis post-verification CTA, NutritionDetail retroactive CTA
- Composite gamification scoring (back-label = 1.0, front-label = 0.5 credit)
- Enrichment JSONB on `barcodeVerifications` (latest scan overwrites, does not affect consensus)
- 38 new tests (service + route + badge tier composite scores)

### Public Verified Product API (Phase 2b) — PR #22

Public REST API for external developers to query product nutrition data by barcode (`GET /api/v1/products/:barcode`).

Includes:

- API key authentication (Stripe-style prefix + bcrypt hash, in-memory cache)
- Tiered responses: Free = unverified data (onramp), Paid = verified data with provenance
- Monthly rate limiting with persistent DB counters (free: 500/mo, starter: 10K, pro: 100K)
- Admin endpoints for API key CRUD (`/api/admin/api-keys`)
- Developer docs page at `/api/v1/docs`
- `barcodeNutrition` table auto-populated on every barcode scan + backfill script
- PII stripping (scannedByUserId/scannedAt never exposed)
- 42 tests across 4 test files

**Post-merge steps:** `npm run db:push`, set `ADMIN_USER_IDS`, run backfill script, reach 1,000 verified products for soft launch.

---

## Next Up

---

## Backlog

These are lower-priority items that can be tackled when relevant:

| Feature                                     | Notes                                                                           |
| ------------------------------------------- | ------------------------------------------------------------------------------- |
| Restaurant receipt → food logging (Phase 3) | Receipt type bifurcation in auto-classification. Deferred from Smart Scan plan. |
| Server-side barcode detection (zxing-wasm)  | Only needed if Vision API barcode hints prove unreliable in production          |
| Verification photo storage                  | Store label/front-label photos for API consumers. Needs object storage (S3/R2). |
| Verification streak rewards                 | Beyond display — actual premium feature unlocks for high verifiers?             |
| Product reformulation detection             | Reset verified status when new scans consistently disagree with consensus       |

---

## How to Use This Doc

When starting a new session:

1. Check this roadmap for what's next
2. Run `/workflows:brainstorm` on the next item if it hasn't been brainstormed
3. Run `/workflows:plan` to create an implementation plan
4. Run `/workflows:work` to implement

Always review PRs before merging.
