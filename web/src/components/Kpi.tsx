import type { ReactNode } from "react";

interface KpiProps {
  value: ReactNode;
  label: ReactNode;
  /** Extra class for the value, e.g. "text-good". */
  valueClassName?: string;
}

export function Kpi({ value, label, valueClassName }: KpiProps) {
  return (
    <div className="panel">
      <div className={valueClassName ? `kpi__value ${valueClassName}` : "kpi__value"}>{value}</div>
      <div className="kpi__label">{label}</div>
    </div>
  );
}
