import Link from "next/link";
import { Icon } from "./Icon";
import { StatusBadge } from "./StatusBadge";
import { BreakEvenBar } from "./BreakEvenBar";
import { fmtGHS, fmtPct } from "@/lib/financials";
import type { Batch, BatchMetrics } from "@/lib/types";

export function BatchCard({ batch, metrics }: { batch: Batch; metrics: BatchMetrics }) {
  return (
    <Link href={`/batches/${batch.id}`} className="batch-card">
      <div className="batch-card-top">
        <div>
          <div className="batch-card-name">{batch.name}</div>
          <div className="batch-card-meta">
            {metrics.unitsSold}/{batch.total_units} sold · {fmtGHS(batch.target_price)} target
          </div>
        </div>
        <StatusBadge status={metrics.status} />
      </div>
      <div className="batch-card-mid">
        <div>
          <div className="stat-label">Profit to date</div>
          <div className={`stat-value ${metrics.profitToDate >= 0 ? "text-profit" : "text-loss"}`}>
            {metrics.profitToDate >= 0 ? "+" : ""}
            {fmtGHS(metrics.profitToDate)}
          </div>
        </div>
        <div>
          <div className="stat-label">ROI</div>
          <div className={`stat-value ${metrics.roiToDate >= 0 ? "text-profit" : "text-loss"}`}>
            {fmtPct(metrics.roiToDate)}
          </div>
        </div>
      </div>
      <div className="batch-card-bottom">
        <BreakEvenBar progress={metrics.breakEvenProgress} brokeEven={metrics.brokeEven} />
        <Icon name="chevron_right" className="batch-card-chevron" />
      </div>
    </Link>
  );
}
