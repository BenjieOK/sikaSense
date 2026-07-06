"use client";

import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { createClient } from "@/lib/supabase/client";
import { fetchBatches, fetchAllSales } from "@/lib/supabase/queries";
import { computeBatchMetrics, buildAnalyticsBuckets, fmtGHS, fmtPct } from "@/lib/financials";
import type { Granularity } from "@/lib/financials";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import { useToast } from "@/components/Toast";
import type { Batch, SaleEvent } from "@/lib/types";

const COLORS = { profit: "#34c77b", brand: "#e8973a", muted: "#8a9490", border: "#262e2a" };

const PRESETS = [
  { k: "7d", label: "7 days" },
  { k: "30d", label: "30 days" },
  { k: "month", label: "This month" },
  { k: "all", label: "All time" },
] as const;

const dateInputStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1.5px solid var(--border-subtle)",
  background: "var(--bg-surface-raised)",
  color: "var(--text-primary)",
  fontSize: 13,
};

export default function AnalyticsPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [sales, setSales] = useState<SaleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Granularity>("daily");
  const [preset, setPreset] = useState<string>("30d");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [productFilter, setProductFilter] = useState("all");
  const { show } = useToast();

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      try {
        const [b, s] = await Promise.all([fetchBatches(supabase), fetchAllSales(supabase)]);
        setBatches(b);
        setSales(s);
      } catch (e: any) {
        show(e.message || "Could not load analytics", "error");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const landedMap = useMemo(() => {
    const map: Record<string, number> = {};
    batches.forEach((b) => {
      map[b.id] = computeBatchMetrics(b, sales).landedPerUnit;
    });
    return map;
  }, [batches, sales]);

  const range = useMemo(() => {
    if (from || to) {
      const start = from ? new Date(`${from}T00:00:00`).getTime() : 0;
      const end = to ? new Date(`${to}T23:59:59`).getTime() : Date.now();
      return { start, end };
    }
    const now = Date.now();
    if (preset === "all") return { start: 0, end: now };
    if (preset === "month") {
      const d = new Date();
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      return { start: d.getTime(), end: now };
    }
    const days = preset === "7d" ? 7 : 30;
    return { start: now - days * 86400000, end: now };
  }, [preset, from, to]);

  const filtered = useMemo(
    () =>
      sales.filter((s) => {
        const t = new Date(s.created_at).getTime();
        return t >= range.start && t <= range.end && (productFilter === "all" || s.product_id === productFilter);
      }),
    [sales, range, productFilter]
  );

  const summary = useMemo(() => {
    let revenue = 0,
      profit = 0,
      units = 0;
    filtered.forEach((s) => {
      revenue += s.units * s.price_per_unit;
      profit += s.units * (s.price_per_unit - (landedMap[s.product_id] || 0));
      units += s.units;
    });
    const cogs = revenue - profit;
    return { revenue, profit, units, count: filtered.length, roi: cogs > 0 ? (profit / cogs) * 100 : 0 };
  }, [filtered, landedMap]);

  const chartData = useMemo(() => buildAnalyticsBuckets(filtered, landedMap, period), [filtered, landedMap, period]);

  const byProduct = useMemo(() => {
    const map: Record<string, { revenue: number; profit: number; units: number }> = {};
    filtered.forEach((s) => {
      if (!map[s.product_id]) map[s.product_id] = { revenue: 0, profit: 0, units: 0 };
      map[s.product_id].revenue += s.units * s.price_per_unit;
      map[s.product_id].profit += s.units * (s.price_per_unit - (landedMap[s.product_id] || 0));
      map[s.product_id].units += s.units;
    });
    return batches
      .filter((b) => map[b.id])
      .map((b) => ({ name: b.name, ...map[b.id] }))
      .sort((a, b) => b.profit - a.profit);
  }, [filtered, batches, landedMap]);

  return (
    <AppShell title="Sales analytics">
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="stat-label">Profit</div>
        <div className={`stat-value ${summary.profit >= 0 ? "text-profit" : "text-loss"}`} style={{ fontSize: 28 }}>
          {fmtGHS(summary.profit)}
        </div>
        <div style={{ display: "flex", gap: 18, marginTop: 10, fontSize: 12.5, color: "var(--text-muted)", flexWrap: "wrap" }}>
          <span>{fmtGHS(summary.revenue)} revenue</span>
          <span>{summary.units} units</span>
          <span>{summary.count} sales</span>
          <span>{fmtPct(summary.roi)} ROI</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {PRESETS.map((p) => (
          <button
            key={p.k}
            onClick={() => {
              setPreset(p.k);
              setFrom("");
              setTo("");
            }}
            className={preset === p.k && !from && !to ? "btn-primary" : "btn-ghost"}
            style={{ padding: "7px 12px", fontSize: 12.5 }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        <Icon name="calendar_month" className="text-muted" />
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={dateInputStyle} />
        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>to</span>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={dateInputStyle} />
        {(from || to) && (
          <button
            onClick={() => {
              setFrom("");
              setTo("");
            }}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
          >
            <Icon name="close" />
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        {(["daily", "weekly", "monthly"] as Granularity[]).map((g) => (
          <button
            key={g}
            onClick={() => setPeriod(g)}
            className={period === g ? "btn-primary" : "btn-ghost"}
            style={{ flex: 1, padding: "8px 0", fontSize: 12.5, textTransform: "capitalize" }}
          >
            {g}
          </button>
        ))}
      </div>

      {batches.length > 1 && (
        <select
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value)}
          style={{ ...dateInputStyle, width: "100%", marginBottom: 16 }}
        >
          <option value="all">All batches</option>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      )}

      {loading ? (
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading…</p>
      ) : chartData.length === 0 ? (
        <div className="empty-state">
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No sales in this period. Adjust the dates or log a sale.</p>
        </div>
      ) : (
        <div className="card" style={{ height: 260, padding: "16px 8px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: COLORS.muted }} tickLine={false} axisLine={{ stroke: COLORS.border }} />
              <YAxis
                tick={{ fontSize: 10, fill: COLORS.muted }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
              />
              <Tooltip
                formatter={(v: number, n: string) => [fmtGHS(v), n === "revenue" ? "Revenue" : "Profit"]}
                contentStyle={{ background: "#1b211e", border: `1px solid ${COLORS.border}`, borderRadius: 10, fontSize: 12, color: "#f3f1ea" }}
                cursor={{ fill: "rgba(255,255,255,.04)" }}
              />
              <Bar dataKey="revenue" radius={[5, 5, 0, 0]} maxBarSize={36} fill={COLORS.brand} />
              <Line type="monotone" dataKey="profit" stroke={COLORS.profit} strokeWidth={2.5} dot={{ r: 3, fill: COLORS.profit }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {byProduct.length > 0 && (
        <>
          <div className="section-title">
            <Icon name="leaderboard" /> By batch
          </div>
          {byProduct.map((p, i) => (
            <div
              key={i}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--border-subtle)" }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {p.units} units · {fmtGHS(p.revenue)} revenue
                </div>
              </div>
              <div className={p.profit >= 0 ? "text-profit" : "text-loss"} style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                {p.profit >= 0 ? "+" : ""}
                {fmtGHS(p.profit)}
              </div>
            </div>
          ))}
        </>
      )}
    </AppShell>
  );
}
