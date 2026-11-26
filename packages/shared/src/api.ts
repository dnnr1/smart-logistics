export const errorCodes = ["VALIDATION_ERROR", "NOT_FOUND", "INTERNAL", "AI_UNAVAILABLE"] as const;
export type ErrorCode = (typeof errorCodes)[number];

export interface ApiError {
  code: ErrorCode;
  message: string;
  requestId: string;
}

export interface ApiSuccess<T> {
  data: T;
  meta: {
    requestId: string;
    page?: number;
    pageSize?: number;
    total?: number;
  };
}

export interface PaginatedData<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
