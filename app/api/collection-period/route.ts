import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authorization";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const notes = body?.notes ? String(body.notes) : null;
  const supabase = admin.supabase;

  const { data: period, error: periodError } = await supabase
    .from("collection_periods")
    .select("*")
    .eq("status", "open")
    .order("opened_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (periodError || !period) return NextResponse.json({ error: "No open collection period found" }, { status: 409 });

  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select("amount, payment_method")
    .eq("period_id", period.id);
  if (paymentsError) return NextResponse.json({ error: paymentsError.message }, { status: 500 });

  const rows = payments ?? [];
  const total = rows.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const cash = rows.filter((payment) => String(payment.payment_method).toLowerCase() === "cash").reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const upi = rows.filter((payment) => String(payment.payment_method).toLowerCase() === "upi").reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  const { error: closeError } = await supabase.from("collection_periods").update({
    status: "closed", closed_at: new Date().toISOString(), closed_by: admin.user.id,
    total_amount: total, cash_amount: cash, upi_amount: upi, payment_count: rows.length, notes,
  }).eq("id", period.id).eq("status", "open");
  if (closeError) return NextResponse.json({ error: closeError.message }, { status: 500 });

  const nextKey = `${new Date().toISOString().slice(0, 10)}-${Date.now()}`;
  const { data: nextPeriod, error: nextError } = await supabase.from("collection_periods").insert({ period_key: nextKey, status: "open" }).select("*").single();
  if (nextError) return NextResponse.json({ error: "Month closed, but the next collection period could not be opened" }, { status: 500 });

  return NextResponse.json({ closed_period: { ...period, total_amount: total, cash_amount: cash, upi_amount: upi, payment_count: rows.length }, next_period: nextPeriod });
}
