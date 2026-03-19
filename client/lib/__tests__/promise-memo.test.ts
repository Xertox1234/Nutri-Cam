import { createPromiseMemo } from "../promise-memo";

describe("createPromiseMemo", () => {
  describe("promise memoization — rapid calls only execute once", () => {
    it("returns the same promise for concurrent calls", async () => {
      let callCount = 0;
      const memo = createPromiseMemo(async () => {
        callCount++;
        // Simulate async work
        await new Promise((r) => setTimeout(r, 10));
        return "session-123";
      });

      const p1 = memo.call();
      const p2 = memo.call();
      const p3 = memo.call();

      // All three should be the exact same promise reference
      expect(p1).toBe(p2);
      expect(p2).toBe(p3);

      const results = await Promise.all([p1, p2, p3]);
      expect(results).toEqual(["session-123", "session-123", "session-123"]);
      expect(callCount).toBe(1);
    });

    it("allows a new call after the first resolves", async () => {
      let callCount = 0;
      const memo = createPromiseMemo(async () => {
        callCount++;
        return `session-${callCount}`;
      });

      const first = await memo.call();
      expect(first).toBe("session-1");

      const second = await memo.call();
      expect(second).toBe("session-2");
      expect(callCount).toBe(2);
    });

    it("clears cache on rejection so retry is possible", async () => {
      let callCount = 0;
      const memo = createPromiseMemo(async () => {
        callCount++;
        if (callCount === 1) throw new Error("network error");
        return "session-ok";
      });

      await expect(memo.call()).rejects.toThrow("network error");
      expect(memo.getPending()).toBeNull();

      const result = await memo.call();
      expect(result).toBe("session-ok");
      expect(callCount).toBe(2);
    });

    it("concurrent calls all reject with the same error", async () => {
      const memo = createPromiseMemo(async () => {
        await new Promise((r) => setTimeout(r, 10));
        throw new Error("server down");
      });

      const p1 = memo.call();
      const p2 = memo.call();

      await expect(p1).rejects.toThrow("server down");
      await expect(p2).rejects.toThrow("server down");
    });

    it("getPending returns the in-flight promise", async () => {
      let resolve!: (value: string) => void;
      const memo = createPromiseMemo(
        () => new Promise<string>((r) => (resolve = r)),
      );

      expect(memo.getPending()).toBeNull();

      const p = memo.call();
      expect(memo.getPending()).toBe(p);

      resolve("done");
      await p;

      expect(memo.getPending()).toBeNull();
    });

    it("simulates rapid photo captures creating only one session", async () => {
      let sessionCreationCount = 0;
      const createSession = createPromiseMemo(async () => {
        sessionCreationCount++;
        // Simulate network latency for session creation
        await new Promise((r) => setTimeout(r, 50));
        return {
          id: "sess-abc",
          ingredients: [],
          photos: [],
          createdAt: Date.now(),
        };
      });

      // Simulate 5 rapid photo captures all calling ensureSession()
      const promises = Array.from({ length: 5 }, () => createSession.call());
      const results = await Promise.all(promises);

      // All should get the same session
      expect(results.every((r) => r.id === "sess-abc")).toBe(true);
      // Session was only created once
      expect(sessionCreationCount).toBe(1);
    });
  });
});
