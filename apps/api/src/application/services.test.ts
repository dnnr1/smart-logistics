import { describe, expect, it } from "vitest";
import type { Delivery } from "@smart-logistics/shared";
import { HeuristicRiskScorer } from "@smart-logistics/domain";
import { InMemoryDeliveryRepository } from "../infrastructure/in-memory-repo";
import { DeliveryService } from "./delivery-service";
import { AnalyticsService } from "./analytics-service";
import { PredictionService } from "./prediction-service";
import { AssistantService } from "./assistant-service";
import type { AssistantGateway } from "./assistant-gateway";

function makeDelivery(overrides: Partial<Delivery> = {}): Delivery {
  const base: Delivery = {
    id: "d1",
    trackingCode: "SLX12345678",
    status: "in_transit",
    origin: "A",
    destination: "B",
    carrier: "Carrier X",
    region: "EU-West",
    distanceKm: 100,
    estimatedDeliveryAt: "2026-11-27T00:00:00.000Z",
    createdAt: "2026-11-20T00:00:00.000Z",
    updatedAt: "2026-11-20T00:00:00.000Z",
    events: [],
  };
  return { ...base, ...overrides };
}

class FakeGateway implements AssistantGateway {
  constructor(private readonly available: boolean) {}
  isAvailable(): boolean {
    return this.available;
  }
  async ask(question: string, context: string): Promise<string> {
    return `answer to ${question} using ${context.length} chars`;
  }
}

describe("DeliveryService", () => {
  it("lists, filters and paginates deliveries", async () => {
    const repo = new InMemoryDeliveryRepository();
    repo.seed([
      makeDelivery({ id: "1", status: "delivered", carrier: "A" }),
      makeDelivery({ id: "2", status: "delayed", carrier: "B", trackingCode: "SLX99999999" }),
    ]);
    const service = new DeliveryService(repo);

    const all = await service.list({ page: 1, pageSize: 20 });
    expect(all.total).toBe(2);

    const delayed = await service.list({ status: "delayed", page: 1, pageSize: 20 });
    expect(delayed.items).toHaveLength(1);

    const search = await service.list({ q: "9999", page: 1, pageSize: 20 });
    expect(search.items[0]?.id).toBe("2");
  });

  it("creates a delivery", async () => {
    const repo = new InMemoryDeliveryRepository();
    const service = new DeliveryService(repo);
    const created = await service.create({
      trackingCode: "SLX12345678",
      origin: "A",
      destination: "B",
      carrier: "C",
      region: "R",
      distanceKm: 5,
      estimatedDeliveryAt: "2026-11-27T00:00:00.000Z",
    });
    expect(created.status).toBe("pending");
    expect(await repo.getById(created.id)).not.toBeNull();
  });
});

describe("PredictionService", () => {
  it("scores a stored delivery by id", async () => {
    const repo = new InMemoryDeliveryRepository();
    repo.seed([makeDelivery({ id: "1", status: "delayed" })]);
    const service = new PredictionService(repo, new HeuristicRiskScorer());
    const result = await service.predict({ deliveryId: "1" });
    expect(result.model).toBe("heuristic");
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it("throws NOT_FOUND for a missing delivery", async () => {
    const repo = new InMemoryDeliveryRepository();
    const service = new PredictionService(repo, new HeuristicRiskScorer());
    await expect(service.predict({ deliveryId: "missing" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});

describe("AssistantService", () => {
  it("returns a grounded answer when the gateway is available", async () => {
    const repo = new InMemoryDeliveryRepository();
    repo.seed([makeDelivery()]);
    const analytics = new AnalyticsService(repo);
    const service = new AssistantService(analytics, new FakeGateway(true));
    const res = await service.ask("How many deliveries are delayed?");
    expect(res.grounded).toBe(true);
    expect(res.sources.length).toBeGreaterThan(0);
  });

  it("throws AI_UNAVAILABLE when the gateway is not configured", async () => {
    const repo = new InMemoryDeliveryRepository();
    const analytics = new AnalyticsService(repo);
    const service = new AssistantService(analytics, new FakeGateway(false));
    await expect(service.ask("anything")).rejects.toMatchObject({ code: "AI_UNAVAILABLE" });
  });
});
