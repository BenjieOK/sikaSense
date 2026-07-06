"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fetchBatch, fetchSalesForBatch, updateBatch, deleteBatch, logSale, deleteSale } from "@/lib/supabase/queries";
import { computeBatchMetrics, fmtGHS, fmtPct } from "@/lib/financials";
import { AppShell } from "@/components/AppShell";
import { TabBar } from "@/components/TabBar";
import { StatusBadge } from "@/components/StatusBadge";
import { BreakEvenBar } from "@/components/BreakEvenBar";
import { QuickLogSale } from "@/components/QuickLogSale";
import { Icon } from "@/components/Icon";
import { useToast } from "@/components/Toast";
import type { Batch, SaleEvent } from "@/lib/types";

export default function BatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { show } = useToast();

  const [batch, setBatch] = useState<Batch | null>(null);
  const [sales, setSales] = useState<SaleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"verdict" | "sourcing">("verdict");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    try {
      const [b, s] = await Promise.all([fetchBatch(supabase, id), fetchSalesForBatch(supabase, id)]);
      if (!b) {
        show("That batch could not be found", "error");
        router.push("/batches");
        return;
      }
      setBatch(b);
      setSales(s);
    } catch (e: any) {
      show(e.message || "Could not load this batch", "error");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !batch) {
    return (
      <AppShell title="Batch">
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading…</p>
      </AppShell>
    );
  }

  const m = computeBatchMetrics(batch, sales);
  const supabase = createClient();

  const onQuickLog = async (units: number, price: number) => {
    try {
      await logSale(supabase, { product_id: batch.id, units, price_per_unit: price });
      show("Sale logged", "success");
      load();
    } catch (e: any) {
      show(e.message || "Could not log that sale", "error");
    }
  };

  const removeSale = async (saleId: string) => {
    try {
      await deleteSale(supabase, saleId);
      show("Sale removed", "success");
      load();
    } catch (e: any) {
      show(e.message || "Could not remove that sale", "error");
    }
  };

  const removeBatch = async () => {
    try {
      await deleteBatch(supabase, batch.id);
      show("Batch deleted", "success");
      router.push("/batches");
    } catch (e: any) {
      show(e.message || "Could not delete this batch", "error");
    }
  };

  return (
    <AppShell title={batch.name}>
      <TabBar active={tab} onChange={setTab} />

      {tab === "verdict" ? (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className="stat-label">True landed cost per item</div>
                <div className="stat-value text-brand" style={{ fontSize: 30 }}>
                  {fmtGHS(m.landedPerUnit)}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                  {batch.name} · {batch.total_units} units · {fmtGHS(m.landedTotal)} total
                </div>
              </div>
              <StatusBadge status={m.status} />
            </div>

            <div style={{ margin: "18px 0 8px" }}>
              <div className="stat-label" style={{ marginBottom: 8 }}>
                Your target selling price (GHS)
              </div>
              <div className="stepper" style={{ maxWidth: 220 }}>
                <button
                  type="button"
                  onClick={async () => {
                    const updated = await updateBatch(supabase, batch.id, {
                      target_price: Math.max(0, batch.target_price - 5),
                    });
                    setBatch(updated);
                  }}
                >
                  <Icon name="remove" />
                </button>
                <input
                  value={batch.target_price}
                  readOnly
                  style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 18 }}
                />
                <button
                  type="button"
                  onClick={async () => {
                    const updated = await updateBatch(supabase, batch.id, {
                      target_price: batch.target_price + 5,
                    });
                    setBatch(updated);
                  }}
                >
                  <Icon name="add" />
                </button>
              </div>
            </div>

            <div className="grid-2" style={{ margin: "14px 0" }}>
              <div className="card" style={{ padding: 12 }}>
                <div className="stat-label">Profit per item</div>
                <div className={`stat-value ${m.marginPerUnit >= 0 ? "text-profit" : "text-loss"}`}>
                  {m.marginPerUnit >= 0 ? "+" : ""}
                  {fmtGHS(m.marginPerUnit)}
                </div>
              </div>
              <div className="card" style={{ padding: 12 }}>
                <div className="stat-label">ROI %</div>
                <div className={`stat-value ${m.roiToDate >= 0 ? "text-profit" : "text-loss"}`}>
                  {m.roiToDate >= 0 ? "+" : ""}
                  {fmtPct(m.roiToDate)}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11.5,
                color: "var(--text-muted)",
                marginBottom: 6,
              }}
            >
              <span>Break-even progress</span>
              <span>
                {m.unitsSold} / {batch.total_units} sold
              </span>
            </div>
            <BreakEvenBar progress={m.breakEvenProgress} brokeEven={m.brokeEven} />
            <p
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: m.brokeEven ? "var(--profit)" : "var(--building)",
                marginTop: 8,
              }}
            >
              {m.brokeEven
                ? "In profit — every sale from here is pure profit."
                : `Sell ${m.breakEvenUnits - m.unitsSold} more to break even.`}
            </p>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <QuickLogSale batch={batch} onLog={onQuickLog} />
          </div>

          {m.discountGivenTotal > 0 && (
            <p style={{ fontSize: 12, color: "var(--building)", fontWeight: 600, textAlign: "center", marginBottom: 16 }}>
              {fmtGHS(m.discountGivenTotal)} in discounts given across this batch
            </p>
          )}

          <div className="section-title">
            <Icon name="receipt_long" /> Sale history{" "}
            <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>· {sales.length}</span>
          </div>
          {sales.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", padding: "16px 0" }}>
              No sales logged yet. Tap &ldquo;+1 Sold&rdquo; each time you sell.
            </p>
          ) : (
            sales.map((s) => {
              const below = batch.target_price - s.price_per_unit > 0.001;
              return (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 0",
                    borderBottom: "1px solid var(--border-subtle)",
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                      background: below ? "var(--building-soft)" : "var(--profit-soft)",
                    }}
                  >
                    <Icon name="inventory_2" className={below ? "text-building" : "text-profit"} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>
                      {s.units} × {fmtGHS(s.price_per_unit)}
                      {below && <span style={{ color: "var(--building)", fontWeight: 600 }}> · below target</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {new Date(s.created_at).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13.5 }}>
                    {fmtGHS(s.units * s.price_per_unit)}
                  </div>
                  <button
                    onClick={() => removeSale(s.id)}
                    style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                    aria-label="Remove sale"
                  >
                    <Icon name="close" />
                  </button>
                </div>
              );
            })
          )}

          <button onClick={() => setConfirmDelete(true)} className="link-btn" style={{ color: "var(--loss)", marginTop: 20 }}>
            Delete this batch
          </button>
        </>
      ) : (
        <SourcingTab
          batch={batch}
          onSave={async (patch) => {
            const updated = await updateBatch(supabase, batch.id, patch);
            setBatch(updated);
            show("Sourcing details saved", "success");
          }}
        />
      )}

      {confirmDelete && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.55)",
            display: "grid",
            placeItems: "center",
            zIndex: 60,
            padding: 24,
          }}
        >
          <div className="card" style={{ maxWidth: 320 }}>
            <p style={{ fontWeight: 800, marginBottom: 6 }}>Delete this batch?</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
              This removes {batch.name} and all {sales.length} sale record(s). This can&apos;t be undone.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmDelete(false)}>
                Keep
              </button>
              <button
                className="btn-primary"
                style={{ flex: 1, background: "var(--loss)", color: "#fff" }}
                onClick={removeBatch}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function SourcingTab({
  batch,
  onSave,
}: {
  batch: Batch;
  onSave: (patch: Partial<Batch>) => Promise<void>;
}) {
  const router = useRouter();
  const [f, setF] = useState({
    name: batch.name,
    wholesaler_cost: String(batch.wholesaler_cost),
    shipping_fees: String(batch.shipping_fees),
    packaging_cost: String(batch.packaging_cost),
    total_units: String(batch.total_units),
    target_price: String(batch.target_price),
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!f.name.trim()) errs.name = "Item name is required";
    if (!f.total_units || parseInt(f.total_units, 10) <= 0) errs.total_units = "Enter units greater than 0";
    if (!f.target_price || parseFloat(f.target_price) <= 0) errs.target_price = "Enter a target price greater than 0";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      await onSave({
        name: f.name.trim(),
        wholesaler_cost: parseFloat(f.wholesaler_cost) || 0,
        shipping_fees: parseFloat(f.shipping_fees) || 0,
        packaging_cost: parseFloat(f.packaging_cost) || 0,
        total_units: parseInt(f.total_units, 10),
        target_price: parseFloat(f.target_price),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="card" noValidate>
      <div className="section-title" style={{ margin: "0 0 14px" }}>
        <Icon name="package_2" /> Sourcing details
      </div>
      <div className="form-field">
        <label>Item name</label>
        <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        {errors.name && <p className="field-error">{errors.name}</p>}
      </div>
      <div className="form-field">
        <label>Total wholesaler cost (GHS)</label>
        <input
          inputMode="decimal"
          value={f.wholesaler_cost}
          onChange={(e) => setF({ ...f, wholesaler_cost: e.target.value })}
        />
      </div>
      <div className="form-field">
        <label>Shipping & clearing fees (GHS)</label>
        <input
          inputMode="decimal"
          value={f.shipping_fees}
          onChange={(e) => setF({ ...f, shipping_fees: e.target.value })}
        />
      </div>
      <div className="form-field">
        <label>Local packaging cost (GHS)</label>
        <input
          inputMode="decimal"
          value={f.packaging_cost}
          onChange={(e) => setF({ ...f, packaging_cost: e.target.value })}
        />
      </div>
      <div className="form-field">
        <label>Total number of items</label>
        <input
          inputMode="numeric"
          value={f.total_units}
          onChange={(e) => setF({ ...f, total_units: e.target.value })}
        />
        {errors.total_units && <p className="field-error">{errors.total_units}</p>}
      </div>
      <div className="form-field">
        <label>Target selling price (GHS)</label>
        <input
          inputMode="decimal"
          value={f.target_price}
          onChange={(e) => setF({ ...f, target_price: e.target.value })}
        />
        {errors.target_price && <p className="field-error">{errors.target_price}</p>}
      </div>
      <button className="btn-primary btn-full" disabled={saving} type="submit">
        {saving ? "Saving…" : "Save changes"}
      </button>
      <button
        type="button"
        className="btn-dark btn-full"
        style={{ marginTop: 10 }}
        onClick={() => router.push("/batches/new")}
      >
        <Icon name="add" /> Start a new batch
      </button>
    </form>
  );
}
