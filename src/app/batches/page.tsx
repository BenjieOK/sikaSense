"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { fetchBatches, fetchAllSales } from "@/lib/supabase/queries";
import { computeBatchMetrics } from "@/lib/financials";
import { AppShell } from "@/components/AppShell";
import { BatchCard } from "@/components/BatchCard";
import { Icon } from "@/components/Icon";
import { useToast } from "@/components/Toast";
import type { Batch, SaleEvent } from "@/lib/types";

export default function BatchesPage() {
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
        show(e.message || "Could not load batches", "error");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppShell title="Business history">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <Link href="/batches/new" className="btn-primary" style={{ textDecoration: "none" }}>
          <Icon name="add" /> New batch
        </Link>
      </div>

      {loading ? (
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading…</p>
      ) : batches.length === 0 ? (
        <div className="empty-state">
          <Icon name="inventory_2" className="text-brand" style={{ fontSize: 36 }} />
          <p style={{ fontWeight: 800, marginTop: 10 }}>No batches yet</p>
          <p style={{ color: "var(--text-muted)", fontSize: 13, margin: "6px 0 16px" }}>
            Every batch you source will show up here with its full sales history.
          </p>
          <Link href="/batches/new" className="btn-primary" style={{ textDecoration: "none", display: "inline-flex" }}>
            <Icon name="add" /> Add a batch
          </Link>
        </div>
      ) : (
        batches.map((b) => <BatchCard key={b.id} batch={b} metrics={computeBatchMetrics(b, sales)} />)
      )}
    </AppShell>
  );
}
