/**
 * Coach Warm-Up Cache Service
 *
 * In-memory warm-up cache for Coach Pro — stores pre-fetched conversation
 * history so the final message send can skip the DB round-trip.
 *
 * Extracted from server/routes/coach-context.ts to avoid cross-route imports.
 *
 * Note: the backing `SessionStore` instance is a storage concern and lives
 * in `server/storage/sessions.ts`. This file composes a coach-specific
 * cache key + TTL-aware consume() on top of it.
 */

import crypto from "crypto";
import {
  warmUpStore,
  WARM_UP_TTL_MS,
  WARM_UP_MAX_PER_USER,
  WARM_UP_MAX_GLOBAL,
  type WarmUpMessage,
} from "../storage/sessions";

export { WARM_UP_TTL_MS, WARM_UP_MAX_PER_USER, WARM_UP_MAX_GLOBAL };

/** Chat message role union — matches the persisted `chat_messages.role`. */
export type WarmUpMessageRole = "user" | "assistant" | "system";

export type { WarmUpMessage };

function cacheKey(userId: string, conversationId: number): string {
  return `${userId}:${conversationId}`;
}

/** Generate a warm-up id using cryptographic randomness (defense-in-depth). */
export function generateWarmUpId(): string {
  return crypto.randomUUID();
}

/**
 * Store a warm-up entry for a user+conversation. Evicts any existing entry
 * for the same `(userId, conversationId)` key so the most recent interim
 * transcript always wins.
 *
 * Uses `createWithKey()` on the underlying session store so the per-user
 * (`WARM_UP_MAX_PER_USER = 1`) and global (`WARM_UP_MAX_GLOBAL = 1000`)
 * caps are honored. Returns `{ ok: true }` when stored, or
 * `{ ok: false; reason; code }` when the caller's cap would be exceeded.
 * Callers must forward the failure to the client (via
 * `sendError(res, 429, reason, code)`) rather than silently dropping
 * the warm-up.
 */
export function setWarmUp(
  userId: string,
  conversationId: number,
  warmUpId: string,
  messages: WarmUpMessage[],
): { ok: true } | { ok: false; reason: string; code: string } {
  const key = cacheKey(userId, conversationId);
  const data = {
    userId,
    conversationId,
    warmUpId,
    messages,
    createdAt: Date.now(),
  };
  return warmUpStore.createWithKey(key, data);
}

/**
 * Consume (and delete) a warm-up entry for a user+conversation.
 * Returns null if no matching entry exists, the warm-up id doesn't match,
 * or the entry has expired.
 */
export function consumeWarmUp(
  userId: string,
  conversationId: number,
  warmUpId: string,
): WarmUpMessage[] | null {
  const key = cacheKey(userId, conversationId);
  // Use the public `.get()` API — the `_internals` field is test-only.
  // (H9 — 2026-04-18: was reading `warmUpStore._internals.store.get(key)`,
  // bypassing the session-store contract.)
  const cached = warmUpStore.get(key);
  if (!cached || cached.warmUpId !== warmUpId) return null;
  if (Date.now() - cached.createdAt > WARM_UP_TTL_MS) {
    warmUpStore.clear(key);
    return null;
  }
  warmUpStore.clear(key);
  return cached.messages;
}

/** Test-only internals — never import from production code. */
export const _testInternals = {
  warmUpStore,
};
