import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { AppEnv } from "../env";
import { HttpError } from "../lib/errors";

/** Expected errors become `{ error }` JSON; anything else is logged and hidden behind a 500. */
export const handleError: ErrorHandler<AppEnv> = (error, c) => {
  if (error instanceof HttpError) return c.json({ error: error.message }, error.status);
  if (error instanceof HTTPException) return error.getResponse(); // e.g. 401 from basic auth

  console.error("Unhandled error", error);
  return c.json({ error: "Internal error" }, 500);
};
