import type { Delivery, RiskInput, RiskResult } from "@smart-logistics/shared";
import type { RiskScorer } from "@smart-logistics/domain";
import { notFound, validationError } from "../errors";
import type { DeliveryRepository } from "./ports";

export class PredictionService {
  constructor(
    private readonly repo: DeliveryRepository,
    private readonly scorer: RiskScorer,
  ) {}

  async predict(input: RiskInput): Promise<RiskResult> {
    if (input.deliveryId) {
      const delivery = await this.repo.getById(input.deliveryId);
      if (!delivery) throw notFound(`Delivery ${input.deliveryId} not found`);
      return this.scorer.score(featuresFromDelivery(delivery, input));
    }
    if (input.distanceKm === undefined || input.status === undefined) {
      throw validationError("Provide a deliveryId or the full set of risk features.");
    }
    return this.scorer.score(input);
  }
}

function featuresFromDelivery(delivery: Delivery, override: RiskInput): RiskInput {
  const transitHours =
    (new Date(delivery.estimatedDeliveryAt).getTime() - new Date(delivery.createdAt).getTime()) /
    3_600_000;
  return {
    distanceKm: override.distanceKm ?? delivery.distanceKm,
    estimatedTransitHours: override.estimatedTransitHours ?? Math.max(0, Math.round(transitHours)),
    carrier: delivery.carrier,
    region: delivery.region,
    status: override.status ?? delivery.status,
    historicalDelayRate: override.historicalDelayRate,
  };
}
