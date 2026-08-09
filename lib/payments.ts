import { createClient as createServerClient } from "@/lib/supabase-server";
import { Payment } from "@/types/payment";

export async function getPaymentsSummary() {
  const supabase = await createServerClient();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .gte("payment_date", startOfMonth.toISOString().slice(0, 10))
    .order("payment_date", { ascending: false });

  if (error) {
    console.error("PAYMENT SUMMARY ERROR:", error);
    return { payments: [] as Payment[], monthTotal: 0, count: 0 };
  }

  const payments = (data ?? []) as Payment[];
  return {
    payments,
    monthTotal: payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    count: payments.length,
  };
}
