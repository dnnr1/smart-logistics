import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { deliverySchema, type Delivery } from "@smart-logistics/shared";
import { loadConfig } from "./config";
import { createContainer } from "./interfaces/container";
import { createRouter } from "./interfaces/router";
import { InMemoryDeliveryRepository } from "./infrastructure/in-memory-repo";
import { BedrockAssistantGateway } from "./infrastructure/bedrock-gateway";
import type { AssistantGateway } from "./application/assistant-gateway";
import { logger } from "./logger";

class DisabledAssistantGateway implements AssistantGateway {
  isAvailable(): boolean {
    return false;
  }
  async ask(): Promise<string> {
    throw new Error("not available");
  }
}

function loadSampleDeliveries(): Delivery[] {
  const candidates = [
    join(process.cwd(), "data", "samples", "deliveries.json"),
    join(process.cwd(), "..", "..", "data", "samples", "deliveries.json"),
  ];
  const file = candidates.find((p) => existsSync(p));
  if (!file) throw new Error("Could not locate data/samples/deliveries.json");
  const raw = JSON.parse(readFileSync(file, "utf8")) as unknown[];
  return raw.map((item) => deliverySchema.parse(item));
}

function toEvent(req: IncomingMessage, body: string): APIGatewayProxyEventV2 {
  const url = new URL(req.url ?? "/", "http://localhost");
  const path = url.pathname;
  const method = req.method ?? "GET";
  const pathParameters: Record<string, string> = {};
  const match = /^\/deliveries\/([^/]+)$/.exec(path);
  if (match?.[1]) pathParameters.id = decodeURIComponent(match[1]);

  const queryStringParameters: Record<string, string> = {};
  for (const [key, value] of url.searchParams) queryStringParameters[key] = value;

  return {
    version: "2.0",
    routeKey: "$default",
    rawPath: path,
    rawQueryString: url.search,
    headers: req.headers as Record<string, string>,
    requestContext: {
      accountId: "local",
      apiId: "local",
      domainName: "localhost",
      domainPrefix: "localhost",
      http: {
        method,
        path,
        protocol: "HTTP/1.1",
        sourceIp: "127.0.0.1",
        userAgent: req.headers["user-agent"] ?? "",
      },
      requestId: randomUUID(),
      routeKey: "$default",
      stage: "$default",
      time: new Date().toISOString(),
      timeEpoch: Date.now(),
    },
    pathParameters,
    queryStringParameters,
    body: body.length > 0 ? body : undefined,
    isBase64Encoded: false,
  } as APIGatewayProxyEventV2;
}

async function main(): Promise<void> {
  const config = loadConfig();
  const repo = new InMemoryDeliveryRepository();
  repo.seed(loadSampleDeliveries());

  const gateway: AssistantGateway = config.bedrockModelId
    ? new BedrockAssistantGateway(config.bedrockModelId, config.bedrockRegion)
    : new DisabledAssistantGateway();

  const container = createContainer(config, { repo, gateway });
  const handle = createRouter(container);

  const server = createServer((req, res: ServerResponse) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", async () => {
      const body = Buffer.concat(chunks).toString("utf8");
      const event = toEvent(req, body);
      const result = await handle(event);
      res.statusCode = result.statusCode;
      for (const [key, value] of Object.entries(result.headers ?? {})) res.setHeader(key, value);
      res.end(result.body ?? "");
    });
  });

  const port = Number(process.env.PORT ?? 3000);
  server.listen(port, () => {
    logger.info("local API listening", { port, deliveries: repo ? "seeded" : "empty" });
  });
}

main().catch((error) => {
  logger.error("failed to start local server", { error: String(error) });
  process.exit(1);
});
