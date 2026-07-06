"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { fetchBatches, fetchAllSales } from "@/lib/supabase/queries";
import { computeBatchMetrics, computePortfolioTotals, fmtGHS, fmtPct } from "@/lib/financials";
import { AppShell } from "@/components/AppShell";
import { BatchCard } from "@/components/BatchCard";
import { Icon } from "@/components/Icon";
import { useToast } from "@/components/Toast";
import type { Batch, SaleEvent } from "@/lib/types";

export default function DashboardPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [sales, setSales] = useState<SaleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { show } = useToast();

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      try {
        const [b, s] = await Promise.all([fetchBatches(supabase), fetchAllSales(supabase)]);
        setBatches(b);
        setSales(s);
      } catch (e: any) {
        show(e.message || "Could not load your data", "error");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = useMemo(() => computePortfolioTotals(batches, sales), [batches, sales]);
  const quickAccess = batches.slice(0, 3);

  return (
    <AppShell title="Dashboard">
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="stat-label">Profit to date · all batches</div>
        <div className={`stat-value ${totals.profit >= 0 ? "text-profit" : "text-loss"}`} style={{ fontSize: 32 }}>
          {fmtGHS(totals.profit)}
        </div>
        <div className="grid-2" style={{ marginTop: 14, gridTemplateColumns: "1fr 1fr 1fr" }}>
          <div>
            <div className="stat-label">ROI</div>
            <div className="stat-value" style={{ fontSize: 15 }}>
              {fmtPct(totals.roi)}
            </div>
          </div>
          <div>
            <div className="stat-label">Revenue</div>
            <div className="stat-value" style={{ fontSize: 15 }}>
              {fmtGHS(totals.revenue)}
            </div>
          </div>
          <div>
            <div className="stat-label">Units sold</div>
            <div className="stat-value" style={{ fontSize: 15 }}>
              {totals.unitsSold}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="section-title" style={{ margin: 0 }}>
          <Icon name="bolt" /> Quick access
        </div>
        <Link href="/batches/new" className="link-btn" style={{ width: "auto", padding: 0 }}>
          + New batch
        </Link>
      </div>

      {loading ? (
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading your batches…</p>
      ) : quickAccess.length === 0 ? (
        <div className="empty-state">
          <Icon name="inventory_2" className="text-brand" style={{ fontSize: 36 }} />
          <p style={{ fontWeight: 800, marginTop: 10 }}>No batches yet</p>
          <p style={{ color: "var(--text-muted)", fontSize: 13, margin: "6px 0 16px" }}>
            Add your first sourcing batch to see your true landed cost and profit.
          </p>
          <Link href="/batches/new" className="btn-primary" style={{ textDecoration: "none", display: "inline-flex" }}>
            <Icon name="add" /> Add a batch
          </Link>
        </div>
      ) : (
        <>
          {quickAccess.map((b) => (
            <BatchCard key={b.id} batch={b} metrics={computeBatchMetrics(b, sales)} />
          ))}
          {batches.length > quickAccess.length && (
            <Link href="/batches" className="link-btn" style={{ marginTop: 4 }}>
              View all {batches.length} batches
            </Link>
          )}
        </>
      )}

      <div className="section-title">
        <Icon name="show_chart" /> This week
      </div>
      <div className="card">
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
          Head to{" "}
          <Link href="/analytics" style={{ color: "var(--brand)" }}>
            Analytics
          </Link>{" "}
          for the full breakdown by day, week, or month.
        </p>
      </div>
    </AppShell>
  );
}
