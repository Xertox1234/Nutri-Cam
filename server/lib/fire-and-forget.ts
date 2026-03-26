/**
 * Execute a promise in the background without blocking the caller.
 * Failures are logged with a context label for easier debugging.
 *
 * @param label — identifies the operation in logs (e.g. "cache-hit-increment")
 * @param promise — the async operation to run in the background
 */
export function fireAndForget(label: string, promise: Promise<unknown>): void {
  promise.catch((err) => console.error(`[${label}]`, err));
}
