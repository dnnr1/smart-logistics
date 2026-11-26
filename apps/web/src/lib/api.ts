export class ApiClientError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api";

interface SuccessEnvelope<T> {
  data: T;
  meta: { requestId: string; page?: number; pageSize?: number; total?: number };
}
interface ErrorEnvelope {
  error: { code: string; message: string; requestId: string };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "content-type": "application/json" },
    ...init,
  });
  const body = (await res.json()) as SuccessEnvelope<T> | ErrorEnvelope;
  if (!res.ok) {
    const err = (body as ErrorEnvelope).error;
    throw new ApiClientError(err?.code ?? "INTERNAL", err?.message ?? "Request failed", res.status);
  }
  return (body as SuccessEnvelope<T>).data;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
};
