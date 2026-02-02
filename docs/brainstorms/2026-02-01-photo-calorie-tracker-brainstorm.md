---
date: 2026-02-01
topic: photo-calorie-tracker
---

# Photo-Based Calorie Tracker

## What We're Building

A premium feature that lets users snap a photo of any meal (home-cooked, restaurant, takeout) and get AI-estimated calories and macros. The AI identifies foods in the image, cross-references with a nutrition database for accurate values, and asks smart follow-up questions when uncertain (e.g., "I see a beverage—what is it?").

Users can set daily calorie and macro goals (protein/carbs/fat) that are AI-calculated based on their profile (activity level, weight goal). Logged meals integrate with the existing daily tracking system.

## Why This Approach

**Considered:**

- **A: Vision API Direct** — Simple GPT-4o analysis. Fast to build but less accurate.
- **B: Vision + Food Database (Chosen)** — Hybrid approach using GPT-4o for food identification, then nutrition database for verified calorie data. More accurate while still convenient.
- **C: Multi-Step Flow** — Maximum control but too much friction for a convenience-focused feature.

**Rationale:** The hybrid approach balances convenience with accuracy. GPT-4o excels at visual identification, while a nutrition database (USDA, Nutritionix, or similar) provides standardized, trusted calorie values. This combination builds user trust in the estimates.

## Key Decisions

- **Premium-only feature**: This is a subscription upsell, not available to free tier users
- **Unified daily log**: Photo-estimated meals appear alongside barcode scans in the same history (with source indicator)
- **Smart follow-ups**: AI asks clarifying questions only when uncertain (portion size, unidentifiable items like beverages)
- **Macro goals**: Users can set daily targets for calories + protein/carbs/fat (not full micronutrients)
- **AI-calculated goals**: Goals are suggested based on user profile data (activity level, primary goal), but user has full editing control
- **Full editing**: Users can manually adjust any estimate after logging

## Open Questions

- Which nutrition database to use? Options:
  - **USDA FoodData Central** — Free, comprehensive, US-focused
  - **Nutritionix API** — Paid, has restaurant foods, good matching
  - **Open Food Facts** — Already integrated for barcodes, could extend
- Should there be a "confidence score" shown to users for AI estimates?
- How to handle foods the database doesn't recognize? (Fall back to pure AI estimate?)
- Weekly goal tracking UI—where does it live? New tab or within Profile?

## Scope Summary

**In scope:**

- Photo capture and AI food identification
- Nutrition database lookup for calorie/macro data
- Smart follow-up question flow
- Daily/weekly calorie and macro goals
- AI-suggested goal targets based on profile
- Manual editing of logged meals
- Premium gating

**Out of scope (for v1):**

- Micronutrient goals (fiber, sodium, sugar)
- Meal planning or recipe suggestions based on goals
- Social/sharing features
- Historical trend analysis

## Next Steps

→ `/workflows:plan` for implementation details
