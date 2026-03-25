import { describe, it, expect } from "vitest";
import {
  detectReformulation,
  REFORMULATION_THRESHOLD,
} from "../reformulation-detection";
import type { VerificationNutrition } from "../verification-comparison";
import type { ConsensusNutritionData } from "@shared/types/verification";

const baseConsensus: ConsensusNutritionData = {
  calories: 200,
  protein: 15,
  carbs: 25,
  fat: 8,
};

/** Nutrition that matches consensus within 5% tolerance */
const matchingNutrition: VerificationNutrition = {
  calories: 205,
  protein: 15,
  totalCarbs: 25,
  totalFat: 8,
};

/** Nutrition that clearly diverges from consensus */
const divergentNutrition: VerificationNutrition = {
  calories: 400,
  protein: 30,
  totalCarbs: 50,
  totalFat: 16,
};

describe("reformulation-detection", () => {
  describe("REFORMULATION_THRESHOLD", () => {
    it("is 3", () => {
      expect(REFORMULATION_THRESHOLD).toBe(3);
    });
  });

  describe("detectReformulation", () => {
    it("returns shouldFlag: false when no divergent scans exist", () => {
      const result = detectReformulation(baseConsensus, []);
      expect(result).toEqual({
        shouldFlag: false,
        divergentCount: 0,
        distinctUsers: 0,
      });
    });

    it("returns shouldFlag: false when all entries match consensus", () => {
      const history = [
        {
          extractedNutrition: matchingNutrition,
          userId: "user1",
          isMatch: true,
        },
        {
          extractedNutrition: matchingNutrition,
          userId: "user2",
          isMatch: true,
        },
        {
          extractedNutrition: matchingNutrition,
          userId: "user3",
          isMatch: true,
        },
      ];
      const result = detectReformulation(baseConsensus, history);
      expect(result.shouldFlag).toBe(false);
      expect(result.divergentCount).toBe(0);
      expect(result.distinctUsers).toBe(0);
    });

    it("returns shouldFlag: false when fewer than threshold divergent scans", () => {
      const history = [
        {
          extractedNutrition: divergentNutrition,
          userId: "user1",
          isMatch: false,
        },
        {
          extractedNutrition: divergentNutrition,
          userId: "user2",
          isMatch: false,
        },
      ];
      const result = detectReformulation(baseConsensus, history);
      expect(result.shouldFlag).toBe(false);
      expect(result.divergentCount).toBe(2);
      expect(result.distinctUsers).toBe(2);
    });

    it("returns shouldFlag: false when enough divergent scans but all from same user", () => {
      const history = [
        {
          extractedNutrition: divergentNutrition,
          userId: "user1",
          isMatch: false,
        },
        {
          extractedNutrition: divergentNutrition,
          userId: "user1",
          isMatch: false,
        },
        {
          extractedNutrition: divergentNutrition,
          userId: "user1",
          isMatch: false,
        },
      ];
      const result = detectReformulation(baseConsensus, history);
      expect(result.shouldFlag).toBe(false);
      expect(result.divergentCount).toBe(3);
      expect(result.distinctUsers).toBe(1);
    });

    it("returns shouldFlag: true when >= threshold divergent scans from >= 2 users", () => {
      const history = [
        {
          extractedNutrition: divergentNutrition,
          userId: "user1",
          isMatch: false,
        },
        {
          extractedNutrition: divergentNutrition,
          userId: "user1",
          isMatch: false,
        },
        {
          extractedNutrition: divergentNutrition,
          userId: "user2",
          isMatch: false,
        },
      ];
      const result = detectReformulation(baseConsensus, history);
      expect(result.shouldFlag).toBe(true);
      expect(result.divergentCount).toBe(3);
      expect(result.distinctUsers).toBe(2);
    });

    it("only counts entries with isMatch === false that also diverge from consensus", () => {
      // isMatch: true entries are skipped even if nutrition diverges
      const history = [
        {
          extractedNutrition: divergentNutrition,
          userId: "user1",
          isMatch: true,
        },
        {
          extractedNutrition: divergentNutrition,
          userId: "user2",
          isMatch: true,
        },
        {
          extractedNutrition: divergentNutrition,
          userId: "user3",
          isMatch: true,
        },
      ];
      const result = detectReformulation(baseConsensus, history);
      expect(result.shouldFlag).toBe(false);
      expect(result.divergentCount).toBe(0);
      expect(result.distinctUsers).toBe(0);
    });

    it("does not count isMatch: false entries that still match consensus nutrition", () => {
      // isMatch is false but extracted nutrition matches consensus within tolerance
      const history = [
        {
          extractedNutrition: matchingNutrition,
          userId: "user1",
          isMatch: false,
        },
        {
          extractedNutrition: matchingNutrition,
          userId: "user2",
          isMatch: false,
        },
        {
          extractedNutrition: matchingNutrition,
          userId: "user3",
          isMatch: false,
        },
      ];
      const result = detectReformulation(baseConsensus, history);
      expect(result.shouldFlag).toBe(false);
      expect(result.divergentCount).toBe(0);
      expect(result.distinctUsers).toBe(0);
    });

    it("correctly counts distinct users across divergent entries", () => {
      const history = [
        {
          extractedNutrition: divergentNutrition,
          userId: "user1",
          isMatch: false,
        },
        {
          extractedNutrition: divergentNutrition,
          userId: "user2",
          isMatch: false,
        },
        {
          extractedNutrition: divergentNutrition,
          userId: "user3",
          isMatch: false,
        },
        {
          extractedNutrition: divergentNutrition,
          userId: "user1",
          isMatch: false,
        },
      ];
      const result = detectReformulation(baseConsensus, history);
      expect(result.shouldFlag).toBe(true);
      expect(result.divergentCount).toBe(4);
      expect(result.distinctUsers).toBe(3);
    });

    it("handles mixed matching and non-matching entries", () => {
      const history = [
        {
          extractedNutrition: matchingNutrition,
          userId: "user1",
          isMatch: true,
        },
        {
          extractedNutrition: divergentNutrition,
          userId: "user2",
          isMatch: false,
        },
        {
          extractedNutrition: matchingNutrition,
          userId: "user3",
          isMatch: false,
        }, // isMatch false but matches consensus
        {
          extractedNutrition: divergentNutrition,
          userId: "user3",
          isMatch: false,
        },
        {
          extractedNutrition: divergentNutrition,
          userId: "user4",
          isMatch: true,
        }, // isMatch true, skipped
        {
          extractedNutrition: divergentNutrition,
          userId: "user1",
          isMatch: false,
        },
      ];
      const result = detectReformulation(baseConsensus, history);
      expect(result.shouldFlag).toBe(true);
      expect(result.divergentCount).toBe(3);
      expect(result.distinctUsers).toBe(3); // user2, user3, user1
    });

    it("returns shouldFlag: true at exactly the threshold boundary", () => {
      const history = [
        {
          extractedNutrition: divergentNutrition,
          userId: "user1",
          isMatch: false,
        },
        {
          extractedNutrition: divergentNutrition,
          userId: "user2",
          isMatch: false,
        },
        {
          extractedNutrition: divergentNutrition,
          userId: "user2",
          isMatch: false,
        },
      ];
      const result = detectReformulation(baseConsensus, history);
      expect(result.shouldFlag).toBe(true);
      expect(result.divergentCount).toBe(3);
      expect(result.distinctUsers).toBe(2);
    });

    it("returns shouldFlag: false at one below the threshold", () => {
      const history = [
        {
          extractedNutrition: divergentNutrition,
          userId: "user1",
          isMatch: false,
        },
        {
          extractedNutrition: divergentNutrition,
          userId: "user2",
          isMatch: false,
        },
      ];
      const result = detectReformulation(baseConsensus, history);
      expect(result.shouldFlag).toBe(false);
      expect(result.divergentCount).toBe(2);
      expect(result.distinctUsers).toBe(2);
    });
  });
});
