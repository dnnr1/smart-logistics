import { describe, expect, it } from "vitest";
import { HeuristicRiskScorer } from "./heuristic";

const scorer = new HeuristicRiskScorer();

describe("HeuristicRiskScorer", () => {
  it("returns a low score for a short, on-time delivery", async () => {
    const result = await scorer.score({
      distanceKm: 100,
      estimatedTransitHours: 5,
      carrier: "Fast Co",
      region: "EU-West",
      status: "delivered",
      historicalDelayRate: 0.05,
    });
    expect(result.score).toBeLessThan(33);
    expect(result.level).toBe("low");
    expect(result.model).toBe("heuristic");
  });

  it("returns a high score for a delayed long-haul delivery", async () => {
    const result = await scorer.score({
      distanceKm: 1800,
      estimatedTransitHours: 90,
      carrier: "Slow Co",
      region: "EU-South",
      status: "delayed",
      historicalDelayRate: 0.6,
    });
    expect(result.score).toBeGreaterThanOrEqual(66);
    expect(result.level).toBe("high");
    expect(result.factors.length).toBeGreaterThan(0);
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("clamps the score to the 0-100 range", async () => {
    const result = await scorer.score({
      distanceKm: 20000,
      estimatedTransitHours: 500,
      status: "delayed",
      historicalDelayRate: 1,
    });
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it("explains each contributing factor", async () => {
    const result = await scorer.score({
      distanceKm: 900,
      estimatedTransitHours: 60,
      status: "delayed",
      historicalDelayRate: 0.4,
    });
    const names = result.factors.map((f) => f.name);
    expect(names).toContain("distance");
    expect(names).toContain("status");
  });
});
