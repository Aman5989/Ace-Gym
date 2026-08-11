import { NextRequest, NextResponse } from "next/server";

import { getCurrentAppUser, requireAdmin } from "@/lib/authorization";

export async function GET(request: NextRequest) {
  const memberId = request.nextUrl.searchParams.get("member_id");
  const showAll = request.nextUrl.searchParams.get("all") === "true";

  if (!memberId && !showAll) {
    return NextResponse.json({ error: "member_id or all=true is required" }, { status: 400 });
  }

  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });

  const supabase = admin.supabase;
  let query = supabase
    .from("payments")
    .select("*, member:members(full_name, phone), collection_period:collection_periods(period_key, status)")
    .order("payment_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (memberId) query = query.eq("member_id", memberId);
  const { data, error } = await query;

  if (error) {
    console.error("PAYMENT HISTORY ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ payments: data ?? [] });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const memberId = String(body.member_id ?? "");
    const amount = Number(body.amount);
    const paymentMethod = String(body.payment_method ?? "UPI");
    const paymentDate = String(body.payment_date ?? "");
    const notes = body.notes ? String(body.notes) : null;
    const requestedCash = Number(body.cash_amount ?? 0);
    const requestedUpi = Number(body.upi_amount ?? 0);
    const isMixed = paymentMethod === "UPI + Cash" || paymentMethod === "Half UPI + Half Cash";
    const cashAmount = isMixed ? requestedCash : paymentMethod === "Cash" ? amount : 0;
    const upiAmount = isMixed ? requestedUpi : paymentMethod === "UPI" ? amount : 0;
    const componentTotal = cashAmount + upiAmount;

    if (
      !memberId ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !paymentDate ||
      !Number.isFinite(cashAmount) ||
      !Number.isFinite(upiAmount) ||
      cashAmount < 0 ||
      upiAmount < 0 ||
      (isMixed && (cashAmount <= 0 || upiAmount <= 0 || Math.abs(componentTotal - amount) > 0.01))
    ) {
      return NextResponse.json(
        { error: "member_id, a positive amount, and payment_date are required" },
        { status: 400 },
      );
    }

    const context = await getCurrentAppUser();
    if (!context.user || !["admin", "trainer"].includes(context.role ?? "")) {
      return NextResponse.json({ error: "Admin or trainer access required" }, { status: 403 });
    }

    const { data, error } = await context.supabase.rpc("record_member_renewal", {
      target_member_id: memberId,
      target_amount: amount,
      target_payment_method: paymentMethod,
      target_cash_amount: cashAmount,
      target_upi_amount: upiAmount,
      target_payment_date: paymentDate,
      target_notes: notes,
    });

    if (error) {
      console.error("RENEWAL RPC ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const renewal = Array.isArray(data) ? data[0] : data;
    if (!renewal?.payment_id || !renewal?.next_due_date) {
      return NextResponse.json({ error: "Renewal could not be verified" }, { status: 502 });
    }

    return NextResponse.json(
      {
        payment: { id: renewal.payment_id },
        next_due_date: renewal.next_due_date,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("PAYMENT REQUEST FAILED:", error);
    return NextResponse.json({ error: "Invalid payment request" }, { status: 400 });
  }
}
