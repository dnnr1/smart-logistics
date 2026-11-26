import type { Analytics, AssistantResponse, AssistantSource } from "@smart-logistics/shared";
import { aiUnavailable } from "../errors";
import type { AnalyticsService } from "./analytics-service";
import type { AssistantGateway } from "./assistant-gateway";

export class AssistantService {
  constructor(
    private readonly analytics: AnalyticsService,
    private readonly gateway: AssistantGateway,
  ) {}

  async ask(question: string): Promise<AssistantResponse> {
    if (!this.gateway.isAvailable()) {
      throw aiUnavailable("The AI assistant is not configured on this environment.");
    }
    const analytics = await this.analytics.get();
    const context = buildContext(analytics);
    const answer = await this.gateway.ask(question, context);
    return { answer, grounded: true, sources: buildSources(analytics) };
  }
}

function buildContext(a: Analytics): string {
  const worstRegions = a.regionPerformance
    .slice(0, 3)
    .map((r) => `${r.region} (${(r.delayRate * 100).toFixed(0)}% delay)`)
    .join(", ");
  const worstCarriers = a.carrierPerformance
    .slice(0, 3)
    .map((c) => `${c.carrier} (${(c.onTimeRate * 100).toFixed(0)}% on-time)`)
    .join(", ");
  return [
    `Total deliveries: ${a.totalDeliveries}`,
    `In transit: ${a.inTransit}`,
    `Completed: ${a.completed}`,
    `Delayed: ${a.delayed}`,
    `Success rate: ${(a.successRate * 100).toFixed(1)}%`,
    `Regions with highest delay rate: ${worstRegions || "n/a"}`,
    `Carriers with lowest on-time rate: ${worstCarriers || "n/a"}`,
  ].join("\n");
}

function buildSources(a: Analytics): AssistantSource[] {
  const sources: AssistantSource[] = [
    { type: "count", label: "total deliveries", value: a.totalDeliveries },
    { type: "count", label: "delayed", value: a.delayed },
    { type: "rate", label: "success rate", value: a.successRate },
  ];
  const worstRegion = a.regionPerformance[0];
  if (worstRegion) {
    sources.push({ type: "region", label: worstRegion.region, value: worstRegion.delayRate });
  }
  const worstCarrier = a.carrierPerformance[0];
  if (worstCarrier) {
    sources.push({ type: "carrier", label: worstCarrier.carrier, value: worstCarrier.onTimeRate });
  }
  return sources;
}
