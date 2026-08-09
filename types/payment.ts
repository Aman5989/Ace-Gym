export type PaymentMethod = "UPI" | "Cash" | "Half UPI + Half Cash" | "Card" | "Bank Transfer";

export interface Payment {
  id: string;
  member_id: string;
  amount: number;
  payment_method: PaymentMethod | string;
  payment_date: string;
  notes: string | null;
  created_at: string;
  period_id?: string | null;
}

export interface PaymentWithMember extends Payment {
  member?: {
    full_name: string;
    phone: string;
  } | null;
  collection_period?: {
    period_key: string;
    status: "open" | "closed";
  } | null;
}
