import type { ContentfulStatusCode } from "hono/utils/http-status";

/** An error that should reach the API client as `{ error: message }` with the given status. */
export class HttpError extends Error {
  constructor(
    readonly status: ContentfulStatusCode,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const badRequest = (message: string) => new HttpError(400, message);
export const notFound = (message: string) => new HttpError(404, message);
