import type { APIGatewayProxyEventV2 } from "aws-lambda";
import type { AnalyticsService } from "../../application/analytics-service";
import { ok, toErrorResponse, type ApiResult } from "../http";

export function getAnalytics(service: AnalyticsService) {
  return async (_event: APIGatewayProxyEventV2, requestId: string): Promise<ApiResult> => {
    try {
      const analytics = await service.get();
      return ok(analytics, requestId);
    } catch (error) {
      return toErrorResponse(error, requestId);
    }
  };
}
