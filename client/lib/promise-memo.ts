/**
 * Creates a memoized async function that deduplicates concurrent calls.
 *
 * While a call is in-flight, subsequent calls return the same promise.
 * On success, the cached result is cleared so future calls re-execute.
 * On failure, the cache is cleared immediately so the next call retries.
 *
 * This is the pattern used by `ensureSession()` in CookSessionCaptureScreen
 * to prevent duplicate session creation during rapid photo captures.
 */
export function createPromiseMemo<T>(fn: () => Promise<T>): {
  call: () => Promise<T>;
  /** Visible for testing — the currently cached promise, if any. */
  getPending: () => Promise<T> | null;
} {
  let pending: Promise<T> | null = null;

  return {
    call(): Promise<T> {
      if (pending) return pending;

      pending = fn()
        .then((result) => {
          pending = null;
          return result;
        })
        .catch((err) => {
          pending = null;
          throw err;
        });

      return pending;
    },
    getPending() {
      return pending;
    },
  };
}
