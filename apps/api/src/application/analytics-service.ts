import type { Analytics } from "@smart-logistics/shared";
import { computeAnalytics } from "@smart-logistics/domain";
import type { DeliveryRepository } from "./ports";

export class AnalyticsService {
  constructor(private readonly repo: DeliveryRepository) {}

  async get(): Promise<Analytics> {
    const deliveries = await this.repo.all();
    return computeAnalytics(deliveries, new Date());
  }
}
