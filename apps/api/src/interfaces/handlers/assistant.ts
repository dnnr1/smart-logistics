import { assistantRequestSchema } from "@smart-logistics/shared";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import type { AssistantService } from "../../application/assistant-service";
import { ok, toErrorResponse, type ApiResult } from "../http";

export function askAssistant(service: AssistantService) {
  return async (event: APIGatewayProxyEventV2, requestId: string): Promise<ApiResult> => {
    try {
      const body = JSON.parse(event.body ?? "{}");
      const { question } = assistantRequestSchema.parse(body);
      const answer = await service.ask(question);
      return ok(answer, requestId);
    } catch (error) {
      return toErrorResponse(error, requestId);
    }
  };
}
