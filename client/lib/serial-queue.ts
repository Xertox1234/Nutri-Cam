/**
 * Creates a serial execution queue — tasks are processed one at a time in FIFO order.
 *
 * This is the pattern used by CookSessionCaptureScreen to ensure photo analyses
 * don't run concurrently (each `handleAnalyzePhoto` awaits before the next starts).
 */
export function createSerialQueue() {
  let tail: Promise<void> = Promise.resolve();

  return {
    /**
     * Enqueue a task. It will not start until all previously enqueued tasks
     * have completed (or failed). Errors in one task do not block subsequent tasks.
     */
    enqueue<T>(task: () => Promise<T>): Promise<T> {
      const next = tail.then(
        () => task(),
        () => task(), // still run even if previous task failed
      );
      // Update tail — swallow rejections so future tasks aren't blocked
      tail = next.then(
        () => {},
        () => {},
      );
      return next;
    },
    /** Visible for testing — resolves when all enqueued tasks have settled. */
    drain(): Promise<void> {
      return tail;
    },
  };
}
