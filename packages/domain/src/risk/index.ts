import type { RiskInput, RiskResult } from "@smart-logistics/shared";
import { HeuristicRiskScorer } from "./heuristic";
import type { RiskScorer } from "./scorer";

export { HeuristicRiskScorer };
export { SageMakerRiskScorer } from "./sagemaker";
export type { RiskScorer } from "./scorer";

export type RiskScorerKind = "heuristic" | "sagemaker";

/**
 * Selects a risk scorer. Only the heuristic baseline is implemented today; requesting the
 * SageMaker scorer fails loudly (it is never silently replaced by the heuristic).
 */
export function createRiskScorer(kind: RiskScorerKind): RiskScorer {
  if (kind === "sagemaker") {
    throw new Error(
      "SageMaker risk scorer is not configured. Set RISK_SCORER=heuristic or implement SageMakerRiskScorer.",
    );
  }
  return new HeuristicRiskScorer();
}

export type { RiskInput, RiskResult };
