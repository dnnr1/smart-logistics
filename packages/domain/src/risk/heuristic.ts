import type { RiskFactor, RiskInput, RiskLevel, RiskResult } from "@smart-logistics/shared";
import type { RiskScorer } from "./scorer";

/**
 * Transparent, explainable heuristic. This is a DEMONSTRATION BASELINE, not a trained model.
 * Each factor contributes a bounded number of points; the total is clamped to [0, 100].
 */
export class HeuristicRiskScorer implements RiskScorer {
  readonly model = "heuristic" as const;

  async score(input: RiskInput): Promise<RiskResult> {
    const factors: RiskFactor[] = [];

    const distance = input.distanceKm ?? 0;
    const distancePoints = distance > 1500 ? 20 : distance > 800 ? 12 : distance > 300 ? 6 : 0;
    if (distancePoints > 0) {
      factors.push({
        name: "distance",
        contribution: distancePoints,
        detail: `Long distance (${distance} km)`,
      });
    }

    const transit = input.estimatedTransitHours ?? 0;
    const transitPoints = transit > 72 ? 20 : transit > 48 ? 14 : transit > 24 ? 8 : 0;
    if (transitPoints > 0) {
      factors.push({
        name: "transit_time",
        contribution: transitPoints,
        detail: `Long estimated transit (${transit} h)`,
      });
    }

    const carrierRate = input.historicalDelayRate ?? 0;
    const carrierPoints = Math.round(carrierRate * 30);
    if (carrierPoints > 0) {
      factors.push({
        name: "carrier_history",
        contribution: carrierPoints,
        detail: `Carrier historical delay rate ${(carrierRate * 100).toFixed(0)}%`,
      });
    }

    const statusPoints = statusWeight(input.status);
    if (statusPoints > 0) {
      factors.push({
        name: "status",
        contribution: statusPoints,
        detail: `Current status "${input.status}"`,
      });
    }

    const raw = factors.reduce((sum, f) => sum + f.contribution, 0);
    const score = Math.max(0, Math.min(100, raw));
    const level: RiskLevel = score >= 66 ? "high" : score >= 33 ? "medium" : "low";

    return {
      score,
      level,
      factors,
      actions: recommendedActions(level, factors),
      model: this.model,
    };
  }
}

function statusWeight(status: RiskInput["status"]): number {
  switch (status) {
    case "delayed":
      return 30;
    case "pending":
      return 10;
    case "out_for_delivery":
      return 8;
    case "in_transit":
      return 4;
    default:
      return 0;
  }
}

function recommendedActions(level: RiskLevel, factors: RiskFactor[]): string[] {
  const actions: string[] = [];
  if (level === "high") {
    actions.push("Contact the carrier and request an immediate status update.");
    actions.push("Notify the customer of a potential delay and provide a revised ETA.");
  } else if (level === "medium") {
    actions.push("Monitor this delivery closely and re-check the ETA.");
  } else {
    actions.push("No action required; continue standard tracking.");
  }
  if (factors.some((f) => f.name === "carrier_history")) {
    actions.push("Consider re-routing future shipments to a higher-performing carrier.");
  }
  return actions;
}
