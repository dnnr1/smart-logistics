import { describe, expect, it } from "vitest";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import type { Delivery } from "@smart-logistics/shared";
import { HeuristicRiskScorer } from "@smart-logistics/domain";
import { loadConfig } from "../config";
import { createContainer } from "./container";
import { createRouter } from "./router";
import { InMemoryDeliveryRepository } from "../infrastructure/in-memory-repo";
import type { AssistantGateway } from "../application/assistant-gateway";

function makeEvent(
  method: string,
  path: string,
  opts: { body?: unknown; query?: Record<string, string>; id?: string } = {},
): APIGatewayProxyEventV2 {
  return {
    version: "2.0",
    routeKey: "$default",
    rawPath: path,
    rawQueryString: "",
    headers: {},
    requestContext: {
      accountId: "test",
      apiId: "test",
      domainName: "test",
      domainPrefix: "test",
      http: { method, path, protocol: "HTTP/1.1", sourceIp: "127.0.0.1", userAgent: "test" },
      requestId: "req-1",
      routeKey: "$default",
      stage: "$default",
      time: new Date().toISOString(),
      timeEpoch: Date.now(),
    },
    pathParameters: opts.id ? { id: opts.id } : undefined,
    queryStringParameters: opts.query,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    isBase64Encoded: false,
  } as APIGatewayProxyEventV2;
}

class FakeGateway implements AssistantGateway {
  constructor(private readonly available: boolean) {}
  isAvailable(): boolean {
    return this.available;
  }
  async ask(question: string): Promise<string> {
    return `Grounded answer: ${question}`;
  }
}

function makeContainer(available: boolean) {
  const repo = new InMemoryDeliveryRepository();
  const delivery: Delivery = {
    id: "d1",
    trackingCode: "SLX12345678",
    status: "delayed",
    origin: "A",
    destination: "B",
    carrier: "Carrier X",
    region: "EU-West",
    distanceKm: 1800,
    estimatedDeliveryAt: "2026-11-20T00:00:00.000Z",
    createdAt: "2026-11-01T00:00:00.000Z",
    updatedAt: "2026-11-20T00:00:00.000Z",
    events: [],
  };
  repo.seed([delivery]);
  return createContainer(loadConfig(), {
    repo,
    gateway: new FakeGateway(available),
    scorer: new HeuristicRiskScorer(),
  });
}

describe("router", () => {
  it("lists deliveries", async () => {
    const handle = createRouter(makeContainer(true));
    const res = await handle(makeEvent("GET", "/deliveries"));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body ?? "{}").data).toHaveLength(1);
  });

  it("returns 404 for a missing delivery", async () => {
    const handle = createRouter(makeContainer(true));
    const res = await handle(makeEvent("GET", "/deliveries/nope", { id: "nope" }));
    expect(res.statusCode).toBe(404);
  });

  it("creates a delivery and validates input", async () => {
    const handle = createRouter(makeContainer(true));
    const ok = await handle(
      makeEvent("POST", "/deliveries", {
        body: {
          trackingCode: "SLX12345678",
          origin: "A",
          destination: "B",
          carrier: "C",
          region: "R",
          distanceKm: 5,
          estimatedDeliveryAt: "2026-11-27T00:00:00.000Z",
        },
      }),
    );
    expect(ok.statusCode).toBe(201);

    const bad = await handle(makeEvent("POST", "/deliveries", { body: { trackingCode: "x" } }));
    expect(bad.statusCode).toBe(400);
  });

  it("returns analytics", async () => {
    const handle = createRouter(makeContainer(true));
    const res = await handle(makeEvent("GET", "/analytics"));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body ?? "{}").data.totalDeliveries).toBe(1);
  });

  it("scores a delivery risk", async () => {
    const handle = createRouter(makeContainer(true));
    const res = await handle(makeEvent("POST", "/predictions", { body: { deliveryId: "d1" } }));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body ?? "{}").data.level).toBe("high");
  });

  it("answers via the assistant when available", async () => {
    const handle = createRouter(makeContainer(true));
    const res = await handle(
      makeEvent("POST", "/assistant", { body: { question: "How many delayed?" } }),
    );
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body ?? "{}").data.grounded).toBe(true);
  });

  it("returns 503 when the assistant is unavailable", async () => {
    const handle = createRouter(makeContainer(false));
    const res = await handle(
      makeEvent("POST", "/assistant", { body: { question: "How many delayed?" } }),
    );
    expect(res.statusCode).toBe(503);
    expect(JSON.parse(res.body ?? "{}").error.code).toBe("AI_UNAVAILABLE");
  });

  it("returns 404 for unknown routes", async () => {
    const handle = createRouter(makeContainer(true));
    const res = await handle(makeEvent("GET", "/unknown"));
    expect(res.statusCode).toBe(404);
  });
});
