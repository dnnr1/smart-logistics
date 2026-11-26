import type { ErrorCode } from "@smart-logistics/shared";

export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function validationError(message: string): AppError {
  return new AppError("VALIDATION_ERROR", message, 400);
}

export function notFound(message: string): AppError {
  return new AppError("NOT_FOUND", message, 404);
}

export function internalError(message = "Internal server error"): AppError {
  return new AppError("INTERNAL", message, 500);
}

export function aiUnavailable(message = "AI assistant is not configured"): AppError {
  return new AppError("AI_UNAVAILABLE", message, 503);
}
