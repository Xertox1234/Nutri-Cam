---
title: "Fix pre-existing TypeScript errors and lint warnings"
status: backlog
priority: low
created: 2026-02-09
updated: 2026-02-09
assignee:
labels: [typescript, lint, tech-debt]
---

# Fix Pre-Existing TypeScript Errors and Lint Warnings

## Summary

Several TypeScript errors and lint warnings pre-date Phase 4 implementation and should be cleaned up to maintain a clean `npm run check:types` and `npm run lint` output.

## Background

These issues were identified during Phase 4 code review verification. They are not caused by Phase 4 changes but exist in the codebase and should be resolved to keep the build clean.

## Acceptance Criteria

- [ ] `server/routes.ts:550` — Fix `Property 'trim' does not exist on type 'string | string[]'` by narrowing the query param type before calling `.trim()`
- [ ] `server/services/nutrition-lookup.ts:239` — Fix `Cannot find name 'err'. Did you mean '_err'?` by correcting variable name in catch block
- [ ] `server/services/nutrition-lookup.ts:238,542` — Fix `'_err' is defined but never used` (2 warnings) by removing the unused catch binding or using it
- [ ] `test/setup.ts:6,7` — Fix `Cannot find name 'beforeEach'` and `Cannot find name 'vi'` by adding vitest global types to tsconfig

## Implementation Notes

### routes.ts:550 — Query param type narrowing

The `req.query` values are typed as `string | string[] | undefined` by Express. Add type narrowing:

```typescript
const raw = req.query.search;
const search = typeof raw === "string" ? raw.trim() : "";
```

### nutrition-lookup.ts:239 — Catch variable mismatch

The catch block uses `_err` but the code references `err`. Either rename to match or remove the binding.

### test/setup.ts — Vitest globals

Add `"types": ["vitest/globals"]` to the test tsconfig or ensure `test/setup.ts` is covered by a tsconfig that includes vitest globals.

## Dependencies

- None — these are independent fixes

## Risks

- Low risk — all are straightforward type/lint fixes

## Updates

### 2026-02-09

- Initial creation during Phase 4 code review verification
