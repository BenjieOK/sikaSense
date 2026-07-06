import type { SupabaseClient } from "@supabase/supabase-js";
import type { Batch, NewBatchInput, SaleEvent, NewSaleInput } from "@/lib/types";

/**
 * Row Level Security (see supabase/schema.sql) already restricts every
 * query below to rows owned by the signed-in user, so these functions
 * don't need to filter by user_id manually — Postgres does it for us.
 */

export async function fetchBatches(supabase: SupabaseClient): Promise<Batch[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Batch[];
}

export async function fetchBatch(supabase: SupabaseClient, id: string): Promise<Batch | null> {
  const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Batch | null;
}

export async function createBatch(supabase: SupabaseClient, input: NewBatchInput): Promise<Batch> {
  const { data, error } = await supabase.from("products").insert(input).select().single();
  if (error) throw error;
  return data as Batch;
}

export async function updateBatch(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<NewBatchInput>
): Promise<Batch> {
  const { data, error } = await supabase.from("products").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data as Batch;
}

export async function deleteBatch(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchSalesForBatch(supabase: SupabaseClient, productId: string): Promise<SaleEvent[]> {
  const { data, error } = await supabase
    .from("sale_events")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SaleEvent[];
}

export async function fetchAllSales(supabase: SupabaseClient): Promise<SaleEvent[]> {
  const { data, error } = await supabase
    .from("sale_events")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SaleEvent[];
}

export async function logSale(supabase: SupabaseClient, input: NewSaleInput): Promise<SaleEvent> {
  const { data, error } = await supabase.from("sale_events").insert(input).select().single();
  if (error) throw error;
  return data as SaleEvent;
}

export async function deleteSale(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("sale_events").delete().eq("id", id);
  if (error) throw error;
}
