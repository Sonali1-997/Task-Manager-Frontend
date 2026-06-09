import type { Priority } from "@/lib/types";
import { initials } from "@/lib/ui";

export function Avatar({ name, size }: { name: string; size?: number }) {
  const s = size ? { width: size, height: size, fontSize: Math.round(size * 0.38) } : undefined;
  return (
    <span className="av" style={s}>
      {initials(name)}
    </span>
  );
}

export function PriorityPill({ value }: { value: Priority }) {
  return <span className={`pill p-${value.toLowerCase()}`}>{value}</span>;
}

export function ProgressBar({ pct }: { pct: number }) {
  const col = pct >= 80 ? "var(--green)" : pct >= 40 ? "var(--accent)" : "var(--amber)";
  return (
    <div className="prog">
      <i style={{ width: `${pct}%`, background: col }} />
    </div>
  );
}
