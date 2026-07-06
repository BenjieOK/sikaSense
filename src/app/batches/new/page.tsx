"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createBatch } from "@/lib/supabase/queries";
import { validateBatchForm } from "@/lib/validation";
import type { BatchFormValues } from "@/lib/validation";
import { fmtGHS, fmtPct } from "@/lib/financials";
import { AppShell } from "@/components/AppShell";
import { useToast } from "@/components/Toast";

const initial: BatchFormValues = {
  name: "",
  source: "Ghana",
  wholesalerCost: "",
  shippingFees: "",
  packagingCost: "",
  otherCosts: "",
  totalUnits: "",
  targetPrice: "",
};

export default function NewBatchPage() {
  const router = useRouter();
  const { show } = useToast();
  const [f, setF] = useState<BatchFormValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const set = (k: keyof BatchFormValues) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }));

  const num = (v: string) => parseFloat(v) || 0;
  const landedTotal = num(f.wholesalerCost) + num(f.shippingFees) + num(f.packagingCost) + num(f.otherCosts);
  const units = num(f.totalUnits);
  const perUnit = units > 0 ? landedTotal / units : 0;
  const margin = num(f.targetPrice) - perUnit;
  const projROI = landedTotal > 0 ? ((units * num(f.targetPrice) - landedTotal) / landedTotal) * 100 : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validateBatchForm(f);
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    setLoading(true);
    const supabase = createClient();
    try {
      const batch = await createBatch(supabase, {
        name: f.name.trim(),
        source: f.source as "Ghana" | "Abroad",
        wholesaler_cost: num(f.wholesalerCost),
        shipping_fees: num(f.shippingFees),
        packaging_cost: num(f.packagingCost),
        other_costs: num(f.otherCosts),
        total_units: Math.round(units),
        target_price: num(f.targetPrice),
      });
      show("Batch created", "success");
      router.push(`/batches/${batch.id}`);
    } catch (err: any) {
      show(err.message || "Could not create batch", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell title="New batch">
      <form onSubmit={submit} noValidate className="card">
        <div className="form-field">
          <label>Item name</label>
          <input value={f.name} onChange={set("name")} placeholder="e.g. Oct Shoe Order" />
          {errors.name && <p className="field-error">{errors.name}</p>}
        </div>

        <div className="form-field">
          <label>Where did you source it?</label>
          <div className="form-row">
            {(["Ghana", "Abroad"] as const).map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setF((p) => ({ ...p, source: s }))}
                className={f.source === s ? "btn-primary" : "btn-ghost"}
                style={{ flex: 1 }}
              >
                {s === "Ghana" ? "🇬🇭 Ghana" : "✈️ Outside Ghana"}
              </button>
            ))}
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label>Total wholesaler cost (GHS)</label>
            <input inputMode="decimal" value={f.wholesalerCost} onChange={set("wholesalerCost")} placeholder="0" />
            {errors.wholesalerCost && <p className="field-error">{errors.wholesalerCost}</p>}
          </div>
          <div className="form-field">
            <label>Shipping & clearing fees (GHS)</label>
            <input inputMode="decimal" value={f.shippingFees} onChange={set("shippingFees")} placeholder="0" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-field">
            <label>Local packaging cost (GHS)</label>
            <input inputMode="decimal" value={f.packagingCost} onChange={set("packagingCost")} placeholder="0" />
          </div>
          <div className="form-field">
            <label>Other costs (GHS)</label>
            <input inputMode="decimal" value={f.otherCosts} onChange={set("otherCosts")} placeholder="0" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-field">
            <label>Total number of items</label>
            <input inputMode="numeric" value={f.totalUnits} onChange={set("totalUnits")} placeholder="0" />
            {errors.totalUnits && <p className="field-error">{errors.totalUnits}</p>}
          </div>
          <div className="form-field">
            <label>Target selling price (GHS)</label>
            <input inputMode="decimal" value={f.targetPrice} onChange={set("targetPrice")} placeholder="0" />
            {errors.targetPrice && <p className="field-error">{errors.targetPrice}</p>}
          </div>
        </div>

        {landedTotal > 0 && (
          <div className="card" style={{ background: "var(--bg-surface-raised)", marginBottom: 16 }}>
            <div className="stat-label" style={{ marginBottom: 10 }}>
              SikaSense check
            </div>
            <div className="grid-2" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
              <div>
                <div className="stat-label">Landed / unit</div>
                <div className="stat-value" style={{ fontSize: 15 }}>
                  {fmtGHS(perUnit)}
                </div>
              </div>
              <div>
                <div className="stat-label">Margin / unit</div>
                <div className={`stat-value ${margin >= 0 ? "text-profit" : "text-loss"}`} style={{ fontSize: 15 }}>
                  {fmtGHS(margin)}
                </div>
              </div>
              <div>
                <div className="stat-label">Projected ROI</div>
                <div className={`stat-value ${projROI >= 0 ? "text-profit" : "text-loss"}`} style={{ fontSize: 15 }}>
                  {fmtPct(projROI)}
                </div>
              </div>
            </div>
          </div>
        )}

        <button type="submit" className="btn-primary btn-full" disabled={loading}>
          {loading ? "Creating…" : "Create batch"}
        </button>
      </form>
    </AppShell>
  );
}
