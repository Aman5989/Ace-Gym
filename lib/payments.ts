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
  notes: string | null;
}

function aggregate(payments: Payment[]) {
  const monthTotal = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const cashTotal = payments.filter((payment) => payment.payment_method.toLowerCase() === "cash").reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const upiTotal = payments.filter((payment) => payment.payment_method.toLowerCase() === "upi").reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  return { monthTotal, cashTotal, upiTotal, count: payments.length };
}

export async function getPaymentsSummary() {
  const supabase = await createServerClient();
  const { data: period } = await supabase.from("collection_periods").select("*").eq("status", "open").order("opened_at", { ascending: false }).limit(1).maybeSingle();

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
    return { payments: [] as Payment[], monthTotal: 0, cashTotal: 0, upiTotal: 0, count: 0, period: period as CollectionPeriod | null };
  }
  const payments = (data ?? []) as Payment[];
  return { payments, ...aggregate(payments), period: period as CollectionPeriod | null };
}

export { aggregate as aggregatePaymentTotals };
