"use client";

import { useState } from "react";
import { Icon } from "./Icon";
import { validateSaleForm } from "@/lib/validation";
import { fmtGHS } from "@/lib/financials";
import type { Batch } from "@/lib/types";

export function QuickLogSale({
  batch,
  onLog,
}: {
  batch: Batch;
  onLog: (units: number, price: number) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [units, setUnits] = useState("1");
  const [price, setPrice] = useState(String(batch.target_price));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const parsedPrice = parseFloat(price) || 0;
  const diff = batch.target_price - parsedPrice;
  const belowTarget = diff > 0.001 && parsedPrice >= 0;
  const hitTotal = belowTarget ? diff * (parseInt(units, 10) || 0) : 0;

  const quickLog = async () => {
    setSubmitting(true);
    try {
      await onLog(1, batch.target_price);
    } finally {
      setSubmitting(false);
    }
  };

  const customLog = async () => {
    const v = validateSaleForm(units, price);
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    setSubmitting(true);
    try {
      await onLog(parseInt(units, 10), parseFloat(price));
      setExpanded(false);
      setUnits("1");
      setPrice(String(batch.target_price));
      setErrors({});
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="quick-log">
      <button className="btn-primary btn-full" onClick={quickLog} disabled={submitting}>
        <Icon name="add_circle" /> +1 Sold at target · {fmtGHS(batch.target_price)}
      </button>
      <button className="link-btn" onClick={() => setExpanded((v) => !v)} type="button">
        {expanded ? "Close" : "Sold a different quantity or price?"}
      </button>

      {expanded && (
        <div className="quick-log-expanded">
          <div className="form-row">
            <div className="form-field">
              <label>Units sold</label>
              <div className="stepper">
                <button
                  type="button"
                  onClick={() => setUnits(String(Math.max(1, (parseInt(units, 10) || 1) - 1)))}
                >
                  <Icon name="remove" />
                </button>
                <input inputMode="numeric" value={units} onChange={(e) => setUnits(e.target.value)} />
                <button type="button" onClick={() => setUnits(String((parseInt(units, 10) || 0) + 1))}>
                  <Icon name="add" />
                </button>
              </div>
              {errors.units && <p className="field-error">{errors.units}</p>}
            </div>
            <div className="form-field">
              <label>Price per unit</label>
              <input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
              {errors.price && <p className="field-error">{errors.price}</p>}
            </div>
          </div>

          {belowTarget && (
            <div className="discount-flag">
              <Icon name="sell" className="discount-flag-icon" />
              <span>
                {fmtGHS(diff)} below target — that&apos;s {fmtGHS(hitTotal)} off this batch&apos;s profit so far.
              </span>
            </div>
          )}

          <button className="btn-dark btn-full" onClick={customLog} disabled={submitting} type="button">
            <Icon name="check" /> Log this sale
          </button>
        </div>
      )}
    </div>
  );
}
