---
date: 2026-02-03
topic: recipe-activity-library
---

# Recipe & Activity Library

## What We're Building

A save/library feature allowing users to save recipe and activity suggestions from their scan history for later use. Free users can save up to 6 items total before being prompted to upgrade.

### Core Features

- **Save functionality** on suggestion cards (recipes & activities from scans)
- **"My Saved Items" section** in Profile tab
- **6-item limit** for free users → upgrade prompt when exceeded
- **External sharing** to Instagram, Twitter, Messages, etc.

## Why This Approach

### Content Sources

| Content Type | Source            | Rationale                                                                  |
| ------------ | ----------------- | -------------------------------------------------------------------------- |
| Recipes      | GPT-4o            | Already integrated, generates contextual recipes from scanned items        |
| Activities   | GPT-4o (existing) | No API exists for creative activities (arts & crafts, science experiments) |

### API Decision: GPT-4o for Both

**Alternatives Considered:**

- **Spoonacular** ($29/mo) - Best features but unnecessary cost for free tier
- **Edamam** ($19+/mo) - Overkill, free tier too limited
- **API Ninjas** (free) - No barcode lookup, smaller database
- **TheMealDB** (free) - Only ~600 recipes, limited variety

**Chosen approach benefits:**

- Unified content generation through existing GPT-4o integration
- Contextual recipes based on actual scanned items
- Can add external APIs later for variety if needed

## Key Decisions

- **Content Source**: GPT-4o for both recipes and activities (unified approach)
- **UI Location**: Saved items section inside Profile tab (not a new tab)
- **Save Limit**: 6 items for free users (recipes + activities combined)
- **Sharing**: External platforms only (Instagram, Twitter, Messages)
- **Downgrade Handling**: 14-day grace period → upgrade prompt → delete oldest if declined
- **Activity Examples**: macaroni → arts & crafts, baking soda → volcano experiment

## User Flow

1. User scans item → sees nutrition + suggestions (existing)
2. Suggestion cards now have "Save" button
3. Tap Save → item added to "My Saved Items" in Profile
4. If 6 items reached → show upgrade prompt
5. From saved items → can share externally or remove

## Future Roadmap

- **AI Health Coach** (paid tier) → generates custom recipes on demand
- **In-app community sharing** → share with other NutriScan users
- **Unlimited saves** for subscribers

## Downgrade Policy

When a paid user downgrades to free tier:

1. **14-day grace period** - User keeps all saved items temporarily
2. **Day 14 prompt** - App offers upgrade to prevent deletion
3. **If user declines** - Oldest items deleted until only 6 newest remain

## Open Questions

- Should activities have categories (arts & crafts, science, cooking projects)?

## Next Steps

→ `/workflows:plan` for implementation details
