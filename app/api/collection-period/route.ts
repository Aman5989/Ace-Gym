import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authorization";
import { aggregatePaymentTotals } from "@/lib/payments";
import { Payment } from "@/types/payment";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });

  const { data, error } = await admin.supabase
    .from("collection_periods")
    .select("*")
    .order("opened_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ periods: data ?? [] });
}

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

  // Pull every column the aggregator needs so the snapshot matches the ledger
  // exactly, including mixed cash/UPI splits and the registration/renewal split.
  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select("id, member_id, amount, cash_amount, upi_amount, payment_method, fee_category, payment_date, notes, created_at, period_id")
    .eq("period_id", period.id);
  if (paymentsError) return NextResponse.json({ error: paymentsError.message }, { status: 500 });

  const rows = (payments ?? []) as Payment[];
  const totals = aggregatePaymentTotals(rows);
  const round = (value: number) => Math.round(value * 100) / 100;

  const snapshot = {
    status: "closed" as const,
    closed_at: new Date().toISOString(),
    closed_by: admin.user.id,
    total_amount: round(totals.monthTotal),
    cash_amount: round(totals.cashTotal),
    upi_amount: round(totals.upiTotal),
    payment_count: totals.count,
    registration_amount: round(totals.registrationTotal),
    renewal_amount: round(totals.renewalTotal),
    registration_count: totals.registrationCount,
    renewal_count: totals.renewalCount,
    notes,
  };

  const { error: closeError } = await supabase
    .from("collection_periods")
    .update(snapshot)
    .eq("id", period.id)
    .eq("status", "open");
  if (closeError) return NextResponse.json({ error: closeError.message }, { status: 500 });

  // Human-readable period key: YYYY-MM, with a suffix only when that month was
  // already closed once, so the archive stays readable instead of showing epochs.
  const monthKey = new Date().toISOString().slice(0, 7);
  const { data: existingKeys } = await supabase
    .from("collection_periods")
    .select("period_key")
    .like("period_key", `${monthKey}%`);
  const reopenCount = (existingKeys ?? []).length;
  const nextKey = reopenCount === 0 ? monthKey : `${monthKey}-R${reopenCount + 1}`;

  const { data: nextPeriod, error: nextError } = await supabase
    .from("collection_periods")
    .insert({ period_key: nextKey, status: "open" })
    .select("*")
    .single();
  if (nextError) return NextResponse.json({ error: "Month closed, but the next collection period could not be opened" }, { status: 500 });

  return NextResponse.json({ closed_period: { ...period, ...snapshot }, next_period: nextPeriod });
}
