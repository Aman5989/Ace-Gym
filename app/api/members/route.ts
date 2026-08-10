import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/authorization";
import { advanceDueDate } from "@/lib/payment-utils";
import { createClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });

  const search = request.nextUrl.searchParams.get("search") || "";
  const filter = request.nextUrl.searchParams.get("filter") || "all";

  let query = admin.supabase
    .from("members")
    .select("*")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  if (filter === "active" || filter === "overdue") {
    const today = new Date().toISOString();
    if (filter === "active") {
      query = query.gte("next_due_date", today);
    } else {
      query = query.lt("next_due_date", today);
    }
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ members: data ?? [] });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Both Admin and Trainer can create members
    const admin = await requireAdmin();
    
    // We use the server-side client to bypass RLS for the initial payment if it's a trainer,
    // but we still need to check if the user is authenticated.
    // Actually, let's just use the server-side client for everything here to ensure consistency.
    const supabase = await createClient();

    const { full_name, phone, father_name, address, gender, timing, payment_type, membership_plan, monthly_fee, join_date, next_due_date, notes, cash_amount, upi_amount } = body;

    if (!full_name || !phone || !membership_plan) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    const isMixedPayment = payment_type === "UPI + Cash";
    const amount = Number(monthly_fee);
    const cashAmount = isMixedPayment ? Number(cash_amount) : payment_type === "Cash" ? amount : 0;
    const upiAmount = isMixedPayment ? Number(upi_amount) : payment_type === "UPI" ? amount : 0;

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid membership fee" }, { status: 400 });
    }

    // Insert Member
    const { data: member, error: memberError } = await supabase
      .from("members")
      .insert({
        full_name,
        phone,
        father_name: father_name || null,
        address: address || null,
        gender: gender || null,
        timing: timing || "Morning",
        payment_type: payment_type || "UPI",
        membership_plan,
        monthly_fee: amount,
        join_date,
        next_due_date: next_due_date || join_date,
        notes: notes || null,
      })
      .select("id")
      .single();

    if (memberError || !member) {
      return NextResponse.json({ error: memberError?.message ?? "Unable to add member" }, { status: 500 });
    }

    // Record Initial Payment
    // First, check if there is an open collection period
    let { data: period, error: periodError } = await supabase
      .from("collection_periods")
      .select("id")
      .eq("status", "open")
      .order("opened_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // If no open period exists, create one for the current month
    if (periodError || !period) {
      const periodKey = new Date().toISOString().slice(0, 7);
      const { data: newPeriod, error: newPeriodError } = await supabase
        .from("collection_periods")
        .insert({ period_key: periodKey, status: "open" })
        .select("id")
        .maybeSingle();
      
      if (newPeriodError || !newPeriod) {
        return NextResponse.json({ member, warning: "Member added, but initial payment was not recorded due to no open collection period." }, { status: 201 });
      }
      period = newPeriod;
    }

    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        member_id: member.id,
        amount,
        payment_method: payment_type || "UPI",
        cash_amount: cashAmount,
        upi_amount: upiAmount,
        payment_date: join_date,
        notes: "Initial membership payment",
        period_id: period.id,
      })
      .select("*")
      .single();

    if (paymentError) {
      // If payment fails, we still return the member but with a warning.
      return NextResponse.json({ member, warning: "Member added, but initial payment was not recorded." }, { status: 201 });
    }

    // Advance Due Date
    const nextDue = advanceDueDate(join_date, membership_plan, join_date);
    await supabase
      .from("members")
      .update({ next_due_date: nextDue })
      .eq("id", member.id);

    return NextResponse.json({ member, payment, next_due_date: nextDue }, { status: 201 });
  } catch (error) {
    console.error("MEMBER CREATION ERROR:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
