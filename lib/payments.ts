import { cache } from "react";
import { createClient as createServerClient } from "@/lib/supabase-server";
import { Payment } from "@/types/payment";

export interface CollectionPeriod {
  id: string;
  period_key: string;
  status: "open" | "closed";
  opened_at: string;
  closed_at: string | null;
  closed_by: string | null;
  total_amount: number;
  cash_amount: number;
  upi_amount: number;
  payment_count: number;
  registration_amount?: number;
  renewal_amount?: number;
  registration_count?: number;
  renewal_count?: number;
  notes: string | null;
}

export interface PaymentTotals {
  monthTotal: number;
  cashTotal: number;
  upiTotal: number;
  count: number;
  registrationTotal: number;
  renewalTotal: number;
  registrationCount: number;
  renewalCount: number;
}

const MIXED_METHODS = new Set(["upi + cash", "half upi + half cash"]);

/**
 * Resolve the cash/UPI split of a single payment.
 *
 * Accounting rules, in priority order:
 * 1. Explicit split columns win, because that is what the operator actually keyed in.
 * 2. A single-channel payment (Cash or UPI) puts the whole amount in that channel.
 * 3. A mixed payment with no stored split is halved, so the two channels still
 *    reconcile to the payment total instead of silently disappearing.
 */
export function splitPayment(payment: Payment) {
  const amount = Number(payment.amount || 0);
  const method = String(payment.payment_method ?? "").toLowerCase();
  const hasCash = payment.cash_amount !== null && payment.cash_amount !== undefined;
  const hasUpi = payment.upi_amount !== null && payment.upi_amount !== undefined;

  if (hasCash || hasUpi) {
    const cash = Number(payment.cash_amount || 0);
    const upi = Number(payment.upi_amount || 0);
    // Trust the stored split only when it reconciles with the payment total.
    if (Math.abs(cash + upi - amount) < 0.01) return { cash, upi };
    // Otherwise fall back to whichever side is known and let the remainder settle.
    if (hasCash && !hasUpi) return { cash, upi: Math.max(amount - cash, 0) };
    if (hasUpi && !hasCash) return { cash: Math.max(amount - upi, 0), upi };
  }

  if (method === "cash") return { cash: amount, upi: 0 };
  if (method === "upi") return { cash: 0, upi: amount };
  if (MIXED_METHODS.has(method)) return { cash: amount / 2, upi: amount / 2 };
  return { cash: 0, upi: amount };
}

export function isRegistration(payment: Payment) {
  const category = String(payment.fee_category ?? "").toLowerCase();
  if (category === "registration") return true;
  if (category === "renewal" || category === "adjustment") return false;
  // Legacy rows written before fee_category existed.
  return String(payment.notes ?? "").toLowerCase().includes("initial membership payment");
}

function aggregate(payments: Payment[]): PaymentTotals {
  return payments.reduce<PaymentTotals>(
    (totals, payment) => {
      const amount = Number(payment.amount || 0);
      const { cash, upi } = splitPayment(payment);
      const registration = isRegistration(payment);

      totals.monthTotal += amount;
      totals.cashTotal += cash;
      totals.upiTotal += upi;
      totals.count += 1;
      if (registration) {
        totals.registrationTotal += amount;
        totals.registrationCount += 1;
      } else {
        totals.renewalTotal += amount;
        totals.renewalCount += 1;
      }
      return totals;
    },
    {
      monthTotal: 0,
      cashTotal: 0,
      upiTotal: 0,
      count: 0,
      registrationTotal: 0,
      renewalTotal: 0,
      registrationCount: 0,
      renewalCount: 0,
    },
  );
}

const EMPTY_TOTALS: PaymentTotals = {
  monthTotal: 0,
  cashTotal: 0,
  upiTotal: 0,
  count: 0,
  registrationTotal: 0,
  renewalTotal: 0,
  registrationCount: 0,
  renewalCount: 0,
};

export async function getPaymentsSummary() {
  const supabase = await createServerClient();
  const { data: period } = await supabase
    .from("collection_periods")
    .select("*")
    .eq("status", "open")
    .order("opened_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let query = supabase.from("payments").select("*").order("payment_date", { ascending: false });
  if (period?.id) query = query.eq("period_id", period.id);
  else {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    query = query.gte("payment_date", startOfMonth.toISOString().slice(0, 10));
  }

  const { data, error } = await query;
  if (error) {
    console.error("PAYMENT SUMMARY ERROR:", error);
    return { payments: [] as Payment[], ...EMPTY_TOTALS, period: period as CollectionPeriod | null };
  }
  const payments = (data ?? []) as Payment[];
  return { payments, ...aggregate(payments), period: period as CollectionPeriod | null };
}

export { aggregate as aggregatePaymentTotals };
