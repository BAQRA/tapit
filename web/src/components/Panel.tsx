import type { ReactNode } from "react";

interface PanelProps {
  title?: string;
  className?: string;
  children: ReactNode;
}

export function Panel({ title, className, children }: PanelProps) {
  return (
    <section className={className ? `panel ${className}` : "panel"}>
      {title && <h2 className="panel__title">{title}</h2>}
      {children}
    </section>
  );
}
