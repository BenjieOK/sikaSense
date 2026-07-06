import type { Batch, SaleEvent, BatchMetrics, BatchStatus } from "./types";

/**
 * SikaSense financial logic core.
 * Deliberately decoupled from the display layer (per the project charter,
 * Section 5.1) — this file has no React, no Supabase, no formatting for
 * a specific screen. It only takes plain data in and returns plain data out.
 */

function landedTotalOf(
  batch: Pick<Batch, "wholesaler_cost" | "shipping_fees" | "packaging_cost" | "other_costs">
): number {
  return (
    (batch.wholesaler_cost || 0) +
    (batch.shipping_fees || 0) +
    (batch.packaging_cost || 0) +
    (batch.other_costs || 0)
  );
}

export function computeBatchMetrics(batch: Batch, sales: SaleEvent[]): BatchMetrics {
  const batchSales = sales.filter((s) => s.product_id === batch.id);
  const landedTotal = landedTotalOf(batch);
  const units = batch.total_units || 0;
  const landedPerUnit = units > 0 ? landedTotal / units : 0;

  const unitsSold = batchSales.reduce((a, s) => a + (s.units || 0), 0);
  const revenue = batchSales.reduce((a, s) => a + (s.units || 0) * (s.price_per_unit || 0), 0);
  const cogsSold = unitsSold * landedPerUnit;
  const profitToDate = revenue - cogsSold;
  const roiToDate = cogsSold > 0 ? (profitToDate / cogsSold) * 100 : 0;

  const marginPerUnit = (batch.target_price || 0) - landedPerUnit;
  const breakEvenUnits = batch.target_price > 0 ? Math.ceil(landedTotal / batch.target_price) : 0;
  const breakEvenProgress = landedTotal > 0 ? Math.min(revenue / landedTotal, 1) : 0;
  const brokeEven = revenue >= landedTotal && landedTotal > 0;
  const unitsRemaining = Math.max(units - unitsSold, 0);

  const discountGivenTotal = batchSales.reduce(
    (a, s) => a + Math.max(0, (batch.target_price || 0) - (s.price_per_unit || 0)) * (s.units || 0),
    0
  );

  let status: BatchStatus = "building";
  if (profitToDate < 0 && unitsSold > 0) status = "loss";
  else if (brokeEven) status = "profitable";

  return {
    landedTotal,
    landedPerUnit,
    unitsSold,
    unitsRemaining,
    revenue,
    cogsSold,
    profitToDate,
    roiToDate,
    marginPerUnit,
    breakEvenUnits,
    breakEvenProgress,
    brokeEven,
    discountGivenTotal,
    status,
  };
}

export function computePortfolioTotals(batches: Batch[], sales: SaleEvent[]) {
  let profit = 0,
    cogs = 0,
    revenue = 0,
    unitsSold = 0;
  for (const b of batches) {
    const m = computeBatchMetrics(b, sales);
    profit += m.profitToDate;
    cogs += m.cogsSold;
    revenue += m.revenue;
    unitsSold += m.unitsSold;
  }
  return { profit, revenue, unitsSold, roi: cogs > 0 ? (profit / cogs) * 100 : 0 };
}

export type Granularity = "daily" | "weekly" | "monthly";

export function bucketKey(ts: string | number, period: Granularity): string {
  const d = new Date(ts);
  if (period === "monthly") return d.toISOString().slice(0, 7);
  if (period === "weekly") {
    const day = (d.getDay() + 6) % 7;
    const mon = new Date(d);
    mon.setDate(d.getDate() - day);
    return mon.toISOString().slice(0, 10);
  }
  return d.toISOString().slice(0, 10);
}

export function bucketLabel(key: string, period: Granularity): string {
  const iso = period === "monthly" ? `${key}-01T00:00:00` : `${key}T00:00:00`;
  const d = new Date(iso);
  if (period === "monthly") return d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export interface AnalyticsBucket {
  key: string;
  label: string;
  revenue: number;
  profit: number;
  units: number;
}

export function buildAnalyticsBuckets(
  sales: SaleEvent[],
  batchLandedPerUnit: Record<string, number>,
  period: Granularity
): AnalyticsBucket[] {
  const buckets: Record<string, AnalyticsBucket> = {};
  for (const s of sales) {
    const k = bucketKey(s.created_at, period);
    if (!buckets[k]) {
      buckets[k] = { key: k, label: bucketLabel(k, period), revenue: 0, profit: 0, units: 0 };
    }
    const landed = batchLandedPerUnit[s.product_id] || 0;
    buckets[k].revenue += s.units * s.price_per_unit;
    buckets[k].profit += s.units * (s.price_per_unit - landed);
    buckets[k].units += s.units;
  }
  return Object.values(buckets).sort((a, b) => a.key.localeCompare(b.key));
}

export function fmtGHS(n: number): string {
  return "GHS " + (Number(n) || 0).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtGHSShort(n: number): string {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1000) return "GHS " + (v / 1000).toFixed(1) + "k";
  return "GHS " + v.toFixed(0);
}

export function fmtPct(n: number): string {
  return (Number(n) || 0).toFixed(1) + "%";
}
