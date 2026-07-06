export type BatchSource = "Ghana" | "Abroad";

export interface Batch {
  id: string;
  user_id: string;
  name: string;
  source: BatchSource;
  wholesaler_cost: number;
  shipping_fees: number;
  packaging_cost: number;
  other_costs: number;
  total_units: number;
  target_price: number;
  created_at: string;
}

export type NewBatchInput = Omit<Batch, "id" | "user_id" | "created_at">;

export interface SaleEvent {
  id: string;
  product_id: string;
  user_id: string;
  units: number;
  price_per_unit: number;
  created_at: string;
}

export type NewSaleInput = {
  product_id: string;
  units: number;
  price_per_unit: number;
};

export type BatchStatus = "profitable" | "building" | "loss";

export interface BatchMetrics {
  landedTotal: number;
  landedPerUnit: number;
  unitsSold: number;
  unitsRemaining: number;
  revenue: number;
  cogsSold: number;
  profitToDate: number;
  roiToDate: number;
  marginPerUnit: number;
  breakEvenUnits: number;
  breakEvenProgress: number;
  brokeEven: boolean;
  discountGivenTotal: number;
  status: BatchStatus;
}
