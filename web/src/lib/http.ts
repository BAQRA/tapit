import type { ApiError } from "../../../shared/api";

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

/** fetch + JSON with the API's `{ error }` messages turned into thrown errors. */
export async function requestJson<T>(
  url: string,
  { method = "GET", body }: { method?: string; body?: unknown } = {},
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiRequestError(response.status, (data as ApiError | null)?.error ?? response.statusText);
  }
  return data as T;
}
