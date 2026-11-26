import { describe, expect, it } from "vitest";
import type { Delivery } from "@smart-logistics/shared";
import { computeAnalytics } from "./analytics";

function makeDelivery(overrides: Partial<Delivery> = {}): Delivery {
  const base: Delivery = {
    id: "d1",
    trackingCode: "SLX12345678",
    status: "delivered",
    origin: "A",
    destination: "B",
    carrier: "Carrier X",
    region: "EU-West",
    distanceKm: 100,
    estimatedDeliveryAt: "2026-11-10T00:00:00.000Z",
    actualDeliveryAt: "2026-11-10T00:00:00.000Z",
    createdAt: "2026-11-01T00:00:00.000Z",
    updatedAt: "2026-11-10T00:00:00.000Z",
    events: [],
  };
  return { ...base, ...overrides };
}

describe("computeAnalytics", () => {
  it("computes totals and success rate", () => {
    const now = new Date("2026-11-26T00:00:00.000Z");
    const deliveries = [
      makeDelivery({ id: "1", status: "delivered" }),
      makeDelivery({ id: "2", status: "delivered" }),
      makeDelivery({ id: "3", status: "delayed", estimatedDeliveryAt: "2026-11-20T00:00:00.000Z" }),
      makeDelivery({
        id: "4",
        status: "in_transit",
        estimatedDeliveryAt: "2026-11-30T00:00:00.000Z",
      }),
    ];
    const a = computeAnalytics(deliveries, now);
    expect(a.totalDeliveries).toBe(4);
    expect(a.completed).toBe(2);
    expect(a.inTransit).toBe(1);
    expect(a.delayed).toBe(1);
    expect(a.successRate).toBeCloseTo(0.5);
  });

  it("ranks carriers by on-time rate (worst first)", () => {
    const now = new Date("2026-11-26T00:00:00.000Z");
    const deliveries = [
      makeDelivery({ id: "1", carrier: "Good", status: "delivered" }),
      makeDelivery({ id: "2", carrier: "Bad", status: "delayed" }),
      makeDelivery({ id: "3", carrier: "Bad", status: "delayed" }),
    ];
    const a = computeAnalytics(deliveries, now);
    expect(a.carrierPerformance[0]?.carrier).toBe("Bad");
  });

  it("returns zeroed metrics for an empty dataset", () => {
    const a = computeAnalytics([], new Date("2026-11-26T00:00:00.000Z"));
    expect(a.totalDeliveries).toBe(0);
    expect(a.successRate).toBe(0);
    expect(a.performanceOverTime).toEqual([]);
  });
});
