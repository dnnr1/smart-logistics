import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { randomUUID } from "node:crypto";
import { loadConfig } from "../config";
import { createContainer, type Container } from "./container";
import { fail, type ApiResult } from "./http";
import { createDelivery, getDelivery, listDeliveries } from "./handlers/deliveries";
import { getAnalytics } from "./handlers/analytics";
import { predict } from "./handlers/predictions";
import { askAssistant } from "./handlers/assistant";

type RouteHandler = (event: APIGatewayProxyEventV2, requestId: string) => Promise<ApiResult>;

function requestIdOf(event: APIGatewayProxyEventV2): string {
  return event.requestContext?.requestId ?? randomUUID();
}

async function route(container: Container, event: APIGatewayProxyEventV2): Promise<ApiResult> {
  const method = event.requestContext?.http?.method ?? "GET";
  const path = event.rawPath ?? "/";
  const requestId = requestIdOf(event);

  const routes: Record<string, RouteHandler> = {
    "GET /deliveries": listDeliveries(container.deliveryService),
    "POST /deliveries": createDelivery(container.deliveryService),
    "GET /analytics": getAnalytics(container.analyticsService),
    "POST /predictions": predict(container.predictionService),
    "POST /assistant": askAssistant(container.assistantService),
  };

  const direct = routes[`${method} ${path}`];
  if (direct) return direct(event, requestId);

  if (method === "GET" && path.startsWith("/deliveries/")) {
    return getDelivery(container.deliveryService)(event, requestId);
  }

  return fail("NOT_FOUND", `Route ${method} ${path} not found`, 404, requestId);
}

/** Handler factory used by tests to inject a container with fakes. */
export function createRouter(container: Container) {
  return (event: APIGatewayProxyEventV2) => route(container, event);
}

let cached: Container | undefined;
function getContainer(): Container {
  if (!cached) cached = createContainer(loadConfig());
  return cached;
}

/** AWS Lambda entry point (bundled by esbuild to dist/index.cjs). */
export async function handler(event: APIGatewayProxyEventV2): Promise<ApiResult> {
  return route(getContainer(), event);
}
