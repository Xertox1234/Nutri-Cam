import { describe, it, expect } from "vitest";
import { subscriptionKeys } from "../query-keys";

describe("subscriptionKeys", () => {
  describe("all", () => {
    it("should return base subscription key", () => {
      expect(subscriptionKeys.all).toEqual(["subscription"]);
    });
  });

  describe("status", () => {
    it("should return status query key", () => {
      expect(subscriptionKeys.status()).toEqual(["subscription", "status"]);
    });

    it("should be derived from all", () => {
      expect(subscriptionKeys.status()[0]).toBe(subscriptionKeys.all[0]);
    });
  });

  describe("scanCount", () => {
    it("should return scanCount query key", () => {
      expect(subscriptionKeys.scanCount()).toEqual([
        "subscription",
        "scanCount",
      ]);
    });

    it("should be derived from all", () => {
      expect(subscriptionKeys.scanCount()[0]).toBe(subscriptionKeys.all[0]);
    });
  });

  describe("products", () => {
    it("should return products query key", () => {
      expect(subscriptionKeys.products()).toEqual(["subscription", "products"]);
    });

    it("should be derived from all", () => {
      expect(subscriptionKeys.products()[0]).toBe(subscriptionKeys.all[0]);
    });
  });

  describe("key uniqueness", () => {
    it("should have unique keys for each query type", () => {
      const keys = [
        subscriptionKeys.status(),
        subscriptionKeys.scanCount(),
        subscriptionKeys.products(),
      ];

      const keyStrings = keys.map((k) => JSON.stringify(k));
      const uniqueKeys = new Set(keyStrings);

      expect(uniqueKeys.size).toBe(keys.length);
    });
  });
});
