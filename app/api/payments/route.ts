import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/authorization";
import { advanceDueDate } from "@/lib/payment-utils";

export async function GET(request: NextRequest) {
  const memberId = request.nextUrl.searchParams.get("member_id");
  const showAll = request.nextUrl.searchParams.get("all") === "true";

  if (!memberId && !showAll) {
    return NextResponse.json({ error: "member_id or all=true is required" }, { status: 400 });
  }

  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });

  const supabase = admin.supabase;
  // recorded_by is included by the wildcard; the join adds member and period context.
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
    const requestedCategory = String(body.fee_category ?? "renewal").toLowerCase();
    const feeCategory = ["registration", "renewal", "adjustment"].includes(requestedCategory)
      ? requestedCategory
      : "renewal";
    const requestedCash = Number(body.cash_amount ?? 0);
    const requestedUpi = Number(body.upi_amount ?? 0);
    const isMixed = paymentMethod === "UPI + Cash" || paymentMethod === "Half UPI + Half Cash";
    const cashAmount = isMixed ? requestedCash : paymentMethod === "Cash" ? amount : 0;
    const upiAmount = isMixed ? requestedUpi : paymentMethod === "UPI" ? amount : 0;
    const componentTotal = cashAmount + upiAmount;

    if (!memberId || !Number.isFinite(amount) || amount <= 0 || !paymentDate || !Number.isFinite(cashAmount) || !Number.isFinite(upiAmount) || cashAmount < 0 || upiAmount < 0 || (isMixed && (cashAmount <= 0 || upiAmount <= 0 || Math.abs(componentTotal - amount) > 0.01))) {
      return NextResponse.json(
        { error: "member_id, a positive amount, and payment_date are required" },
        { status: 400 },
      );
    }

    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });

    const supabase = admin.supabase;
    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("id, full_name, membership_plan, next_due_date")
      .eq("id", memberId)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: memberError?.message ?? "Member not found" },
        { status: 404 },
      );
    }

    const { data: period, error: periodError } = await supabase
      .from("collection_periods")
      .select("id")
      .eq("status", "open")
      .order("opened_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (periodError || !period) {
      return NextResponse.json({ error: "No open collection period is available" }, { status: 409 });
    }

    const nextDueDate = advanceDueDate(
      member.next_due_date,
      member.membership_plan,
      paymentDate,
    );

    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        member_id: memberId,
        amount,
        payment_method: paymentMethod,
        cash_amount: cashAmount,
        upi_amount: upiAmount,
        fee_category: feeCategory,
        payment_date: paymentDate,
        notes,
        period_id: period.id,
        recorded_by: admin.user.id,
      })
      .select("*")
      .single();

    if (paymentError || !payment) {
      console.error("PAYMENT INSERT ERROR:", paymentError);
      return NextResponse.json(
        { error: paymentError?.message ?? "Unable to record payment" },
        { status: 500 },
      );
    }

    const { error: updateError } = await supabase
      .from("members")
      .update({ next_due_date: nextDueDate, updated_at: new Date().toISOString() })
      .eq("id", memberId);

    if (updateError) {
      await supabase.from("payments").delete().eq("id", payment.id);
      console.error("DUE DATE UPDATE ERROR:", updateError);
      return NextResponse.json(
        { error: "Payment was not completed because the due date could not be updated" },
        { status: 500 },
      );
    }

    return NextResponse.json({ payment, next_due_date: nextDueDate }, { status: 201 });
  } catch (error) {
    console.error("PAYMENT REQUEST FAILED:", error);
    return NextResponse.json({ error: "Invalid payment request" }, { status: 400 });
  }
}
