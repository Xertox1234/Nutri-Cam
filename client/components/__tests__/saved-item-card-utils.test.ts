import { describe, it, expect } from "vitest";
import { buildShareContent } from "../saved-item-card-utils";

describe("buildShareContent", () => {
  it("includes title", () => {
    const content = buildShareContent({
      title: "Chicken Salad",
      description: null,
      instructions: null,
      sourceProductName: null,
    });
    expect(content).toBe("Chicken Salad\n");
  });

  it("includes description when present", () => {
    const content = buildShareContent({
      title: "Chicken Salad",
      description: "A healthy salad with grilled chicken",
      instructions: null,
      sourceProductName: null,
    });
    expect(content).toContain("A healthy salad with grilled chicken");
  });

  it("includes instructions when present", () => {
    const content = buildShareContent({
      title: "Chicken Salad",
      description: null,
      instructions: "Mix ingredients and serve",
      sourceProductName: null,
    });
    expect(content).toContain("Instructions:\nMix ingredients and serve");
  });

  it("includes source product name when present", () => {
    const content = buildShareContent({
      title: "Chicken Salad",
      description: null,
      instructions: null,
      sourceProductName: "Rotisserie Chicken",
    });
    expect(content).toContain("Suggested for: Rotisserie Chicken");
  });

  it("includes all fields when all present", () => {
    const content = buildShareContent({
      title: "Chicken Salad",
      description: "A healthy salad",
      instructions: "Mix and serve",
      sourceProductName: "Rotisserie Chicken",
    });
    expect(content).toContain("Chicken Salad");
    expect(content).toContain("A healthy salad");
    expect(content).toContain("Instructions:\nMix and serve");
    expect(content).toContain("Suggested for: Rotisserie Chicken");
  });

  it("omits empty sections", () => {
    const content = buildShareContent({
      title: "Simple Item",
      description: null,
      instructions: null,
      sourceProductName: null,
    });
    expect(content).not.toContain("Instructions:");
    expect(content).not.toContain("Suggested for:");
  });
});
