import type { RiskInput, RiskResult } from "@smart-logistics/shared";
import type { RiskScorer } from "./scorer";

/**
 * Future implementation: call a SageMaker real-time endpoint and map the response to RiskResult.
 * Not implemented yet (no endpoint is provisioned by default). Kept here to document the swap
 * point. Throws a clear error so it can never silently return fake predictions.
 */
export class SageMakerRiskScorer implements RiskScorer {
  readonly model = "sagemaker" as const;

  constructor(private readonly endpointName: string) {}

  async score(_input: RiskInput): Promise<RiskResult> {
    throw new Error(
      `SageMakerRiskScorer is not implemented. Endpoint "${this.endpointName}" inference must be wired up.`,
    );
  }
}
