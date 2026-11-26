import { riskInputSchema } from "@smart-logistics/shared";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import type { PredictionService } from "../../application/prediction-service";
import { ok, toErrorResponse, type ApiResult } from "../http";

export function predict(service: PredictionService) {
  return async (event: APIGatewayProxyEventV2, requestId: string): Promise<ApiResult> => {
    try {
      const body = JSON.parse(event.body ?? "{}");
      const input = riskInputSchema.parse(body);
      const result = await service.predict(input);
      return ok(result, requestId);
    } catch (error) {
      return toErrorResponse(error, requestId);
    }
  };
}
