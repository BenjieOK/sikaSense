import { Icon } from "./Icon";
import type { BatchStatus } from "@/lib/types";

const CONFIG: Record<BatchStatus, { label: string; icon: string; className: string }> = {
  profitable: { label: "Profitable", icon: "trending_up", className: "badge-profitable" },
  building: { label: "Building", icon: "hourglass_top", className: "badge-building" },
  loss: { label: "Below cost", icon: "trending_down", className: "badge-loss" },
};

export function StatusBadge({ status }: { status: BatchStatus }) {
  const c = CONFIG[status];
  return (
    <span className={`status-badge ${c.className}`}>
      <Icon name={c.icon} className="status-badge-icon" />
      {c.label}
    </span>
  );
}
