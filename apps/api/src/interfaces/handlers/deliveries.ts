import type { DeliveryListQuery } from "@smart-logistics/shared";
import { deliveryInputSchema, deliveryListQuerySchema } from "@smart-logistics/shared";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { notFound, validationError } from "../../errors";
import type { DeliveryService } from "../../application/delivery-service";
import { created, ok, paginated, toErrorResponse, type ApiResult } from "../http";

export function listDeliveries(service: DeliveryService) {
  return async (event: APIGatewayProxyEventV2, requestId: string): Promise<ApiResult> => {
    try {
      const query = deliveryListQuerySchema.parse(event.queryStringParameters ?? {});
      const page = await service.list(query as DeliveryListQuery);
      return paginated(page, requestId);
    } catch (error) {
      return toErrorResponse(error, requestId);
    }
  };
}

export function getDelivery(service: DeliveryService) {
  return async (event: APIGatewayProxyEventV2, requestId: string): Promise<ApiResult> => {
    try {
      const id = event.pathParameters?.id;
      if (!id) throw validationError("Missing delivery id.");
      const delivery = await service.get(id);
      if (!delivery) throw notFound(`Delivery ${id} not found`);
      return ok(delivery, requestId);
    } catch (error) {
      return toErrorResponse(error, requestId);
    }
  };
}

export function createDelivery(service: DeliveryService) {
  return async (event: APIGatewayProxyEventV2, requestId: string): Promise<ApiResult> => {
    try {
      const body = JSON.parse(event.body ?? "{}");
      const input = deliveryInputSchema.parse(body);
      const delivery = await service.create(input);
      return created(delivery, requestId);
    } catch (error) {
      return toErrorResponse(error, requestId);
    }
  };
}
