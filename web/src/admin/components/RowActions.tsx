import type { ReactNode } from "react";

/**
 * The action buttons at the end of a table row.
 * Desktop: a compact line of text buttons. Phone: full-size, wrapping buttons.
 */
export function RowActions({ children }: { children: ReactNode }) {
  return <div className="row-actions">{children}</div>;
}
