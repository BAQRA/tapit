import type { Context } from "hono";
import type { z } from "zod";
import { badRequest } from "./errors";

/** Parses the JSON body against a Zod schema; throws a 400 with a readable message on failure. */
export async function parseJsonBody<Schema extends z.ZodType>(
  c: Context,
  schema: Schema,
): Promise<z.infer<Schema>> {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw badRequest("Body must be valid JSON");
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue?.path.join(".");
    throw badRequest(field ? `${field}: ${issue?.message}` : (issue?.message ?? "Invalid body"));
  }
  return result.data;
}
