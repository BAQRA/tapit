/** SQLite stores booleans as 0/1. */
export const toFlag = (value: boolean): number => (value ? 1 : 0);

/**
 * Builds the SET part of an UPDATE from a partial object.
 * Only column names from `columns` (written in code, never user input) reach the SQL;
 * values are always bound as parameters.
 */
export function buildAssignments<Field extends string>(
  columns: Record<Field, string>,
  values: Partial<Record<Field, unknown>>,
): { sql: string; params: unknown[] } {
  const parts: string[] = [];
  const params: unknown[] = [];

  for (const field of Object.keys(columns) as Field[]) {
    if (values[field] === undefined) continue;
    parts.push(`${columns[field]} = ?`);
    params.push(values[field]);
  }
  return { sql: parts.join(", "), params };
}
