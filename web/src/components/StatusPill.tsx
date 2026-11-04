interface StatusPillProps {
  active: boolean;
  on?: string;
  off?: string;
}

export function StatusPill({ active, on = "active", off = "paused" }: StatusPillProps) {
  return <span className={`pill ${active ? "text-good" : "text-bad"}`}>{active ? on : off}</span>;
}
