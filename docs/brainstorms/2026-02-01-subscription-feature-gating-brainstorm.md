---
date: 2026-02-01
topic: subscription-feature-gating
---

# Subscription Feature Gating

## What We're Building

A subscription system that differentiates free and premium users through soft feature gates. Free users get limited functionality with teasers of premium content, encouraging upgrades through an in-app modal. Payment handled natively through App Store / Play Store with annual subscription pricing.

## Why This Approach

Chose **Minimal Viable Subscriptions** over a full-featured implementation:

- Existing subscription infrastructure in codebase (tiers, hooks, feature flags)
- Test conversion rates before adding complexity
- YAGNI - start simple, add robustness based on real usage

## Key Decisions

### Tier Structure

| Feature            | Free             | Premium                                        |
| ------------------ | ---------------- | ---------------------------------------------- |
| Daily scans        | 3                | Unlimited                                      |
| Scan types         | Barcode only     | All (barcode, photo, label)                    |
| Camera features    | Limited          | Full (high-quality, video)                     |
| Recipes/activities | Partial (teaser) | Full access                                    |
| Future features    | -                | Personalization, meal planning, chat assistant |

### Paywall UX: Soft Gates

- Free users see partial content (recipes, activities) as teasers
- Tapping gated content triggers upgrade modal
- 4th scan attempt triggers upgrade modal
- Non-blocking - users can dismiss and continue with free tier

### Payment Integration

- **Provider:** Native App Store / Play Store via `react-native-iap`
- **Pricing:** Annual subscription only (simpler UX, better retention)
- **Validation:** Client-side initially, server validation can be added later

### Upgrade Flow

- **Trigger points:** Gated content tap, scan limit reached, profile upgrade button
- **UI:** Full-screen in-app modal showing benefits + native purchase sheet
- **Post-purchase:** Update local state, sync to server, unlock features immediately

### Subscription Management

- Add subscription section to existing Profile screen
- Show current tier, expiration date, manage/cancel link
- Link to App Store / Play Store for subscription management

## Open Questions

- Specific annual pricing point (e.g., $29.99/year, $39.99/year)?
- Should there be a free trial period?
- Restore purchases flow for reinstalls/new devices?
- How to handle subscription expiration gracefully?

## Next Steps

→ `/workflows:plan` for implementation details
