export type PaymentMethod = "UPI" | "Cash" | "Card" | "Bank Transfer";

export interface Payment {
  id: string;
  member_id: string;
  amount: number;
  payment_method: PaymentMethod | string;
  payment_date: string;
  notes: string | null;
  created_at: string;
}

export interface PaymentWithMember extends Payment {
  member?: {
    full_name: string;
    phone: string;
  } | null;
}
