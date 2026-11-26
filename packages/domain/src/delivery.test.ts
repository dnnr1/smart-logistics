import { describe, expect, it } from "vitest";
import { appendEvent, canTransition, createDelivery, isDelayed } from "./delivery";

describe("delivery domain", () => {
  it("creates a delivery in pending status with an initial event", () => {
    const now = new Date("2026-11-26T00:00:00.000Z");
    const d = createDelivery(
      {
        trackingCode: "SLX12345678",
        origin: "A",
        destination: "B",
        carrier: "C",
        region: "R",
        distanceKm: 10,
        estimatedDeliveryAt: "2026-11-27T00:00:00.000Z",
      },
      "id-1",
      now,
    );
    expect(d.status).toBe("pending");
    expect(d.events).toHaveLength(1);
    expect(d.events[0]?.status).toBe("pending");
  });

  it("validates allowed status transitions", () => {
    expect(canTransition("pending", "in_transit")).toBe(true);
    expect(canTransition("pending", "delivered")).toBe(false);
    expect(canTransition("delivered", "in_transit")).toBe(false);
  });

  it("appends events and updates status", () => {
    const now = new Date("2026-11-26T00:00:00.000Z");
    const d = createDelivery(
      {
        trackingCode: "SLX12345678",
        origin: "A",
        destination: "B",
        carrier: "C",
        region: "R",
        distanceKm: 10,
        estimatedDeliveryAt: "2026-11-27T00:00:00.000Z",
      },
      "id-1",
      now,
    );
    const moved = appendEvent(
      d,
      { status: "in_transit", occurredAt: now.toISOString(), location: "X" },
      now,
    );
    expect(moved.status).toBe("in_transit");
    expect(moved.events).toHaveLength(2);
  });

  it("detects overdue deliveries", () => {
    const now = new Date("2026-11-26T00:00:00.000Z");
    const d = createDelivery(
      {
        trackingCode: "SLX12345678",
        origin: "A",
        destination: "B",
        carrier: "C",
        region: "R",
        distanceKm: 10,
        estimatedDeliveryAt: "2026-11-20T00:00:00.000Z",
      },
      "id-1",
      now,
    );
    expect(isDelayed(d, now)).toBe(true);
  });
});
