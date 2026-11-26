import type { RiskInput, RiskResult } from "@smart-logistics/shared";

/**
 * Port for delivery risk scoring. Implementations must return the same RiskResult shape so
 * the heuristic baseline can be replaced by a SageMaker-backed scorer without API changes.
 */
export interface RiskScorer {
  readonly model: RiskResult["model"];
  score(input: RiskInput): Promise<RiskResult>;
}
