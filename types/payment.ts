export type PaymentMethod = "UPI" | "Cash" | "UPI + Cash" | "Card" | "Bank Transfer";

/**
 * Business meaning of a payment, kept separate from the payment channel.
 * - registration: the first fee collected when a member joins
 * - renewal: every subsequent subscription fee
 * - adjustment: a manual correction entry
 */
export type FeeCategory = "registration" | "renewal" | "adjustment";

export const feeCategoryLabels: Record<FeeCategory, string> = {
  registration: "Registration Fee",
  renewal: "Renewal Fee",
  adjustment: "Adjustment",
};

export function feeCategoryLabel(value?: string | null): string {
  if (value === "registration" || value === "renewal" || value === "adjustment") {
    return feeCategoryLabels[value];
  }
  return feeCategoryLabels.renewal;
}

export interface Payment {
  id: string;
  member_id: string;
  amount: number;
  cash_amount?: number | null;
  upi_amount?: number | null;
  payment_method: PaymentMethod | string;
  fee_category?: FeeCategory | string | null;
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
