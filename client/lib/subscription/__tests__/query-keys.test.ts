import { subscriptionKeys } from "../query-keys";

describe("subscriptionKeys", () => {
  describe("all", () => {
    it('should return ["subscription"]', () => {
      expect(subscriptionKeys.all).toEqual(["subscription"]);
    });

    it("should be a readonly tuple", () => {
      expect(subscriptionKeys.all).toHaveLength(1);
    });
  });

  describe("status", () => {
    it('should return ["subscription", "status"]', () => {
      expect(subscriptionKeys.status()).toEqual(["subscription", "status"]);
    });

    it("should start with the all key", () => {
      expect(subscriptionKeys.status()[0]).toBe(subscriptionKeys.all[0]);
    });
  });

  describe("scanCount", () => {
    it('should return ["subscription", "scanCount"]', () => {
      expect(subscriptionKeys.scanCount()).toEqual([
        "subscription",
        "scanCount",
      ]);
    });

    it("should start with the all key", () => {
      expect(subscriptionKeys.scanCount()[0]).toBe(subscriptionKeys.all[0]);
    });
  });

  describe("products", () => {
    it('should return ["subscription", "products"]', () => {
      expect(subscriptionKeys.products()).toEqual(["subscription", "products"]);
    });

    it("should start with the all key", () => {
      expect(subscriptionKeys.products()[0]).toBe(subscriptionKeys.all[0]);
    });
  });

  it("should have unique second elements for each key factory", () => {
    const secondElements = [
      subscriptionKeys.status()[1],
      subscriptionKeys.scanCount()[1],
      subscriptionKeys.products()[1],
    ];
    const unique = new Set(secondElements);
    expect(unique.size).toBe(secondElements.length);
  });
});
