import type { ApiError, ApiSuccess, PaginatedData } from "@smart-logistics/shared";
import { ZodError } from "zod";
import { AppError } from "../errors";

export interface ApiResult {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

const BASE_HEADERS = {
  "content-type": "application/json",
  "cache-control": "no-store",
};

function json(statusCode: number, body: unknown): ApiResult {
  return { statusCode, headers: BASE_HEADERS, body: JSON.stringify(body) };
}

export function ok<T>(
  data: T,
  requestId: string,
  meta?: Partial<ApiSuccess<T>["meta"]>,
): ApiResult {
  const body: ApiSuccess<T> = { data, meta: { requestId, ...meta } };
  return json(200, body);
}

export function created<T>(data: T, requestId: string): ApiResult {
  const body: ApiSuccess<T> = { data, meta: { requestId } };
  return json(201, body);
}

export function paginated<T>(page: PaginatedData<T>, requestId: string): ApiResult {
  const body: ApiSuccess<T[]> = {
    data: page.items,
    meta: { requestId, page: page.page, pageSize: page.pageSize, total: page.total },
  };
  return json(200, body);
}

export function fail(
  code: ApiError["code"],
  message: string,
  statusCode: number,
  requestId: string,
): ApiResult {
  const body: { error: ApiError } = { error: { code, message, requestId } };
  return json(statusCode, body);
}

export function toErrorResponse(error: unknown, requestId: string): ApiResult {
  if (error instanceof AppError) {
    return fail(error.code, error.message, error.statusCode, requestId);
  }
  if (error instanceof ZodError) {
    const first = error.issues[0];
    const message = first ? `${first.path.join(".")}: ${first.message}` : "Validation failed";
    return fail("VALIDATION_ERROR", message, 400, requestId);
  }
  if (error instanceof SyntaxError) {
    return fail("VALIDATION_ERROR", "Malformed JSON body", 400, requestId);
  }
  return fail("INTERNAL", "Internal server error", 500, requestId);
}
