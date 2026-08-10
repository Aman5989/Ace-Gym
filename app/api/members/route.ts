import { NextRequest, NextResponse } from "next/server";

import { requireAdmin, requireStaff } from "@/lib/authorization";
import { advanceDueDate } from "@/lib/payment-utils";

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

/**
 * Takes an admission. Available to admins and trainers alike.
 *
 * An admission is a single commercial event: a member joins and pays a
 * registration fee. Those two facts must therefore succeed or fail together.
 * Previously the fee was best-effort, so a failed payment insert left a member
 * with no money attached and the monthly collection silently understated. If
 * the fee cannot be recorded we now roll the member back and report the real
 * reason, so the person at the desk knows to retry rather than assuming it
 * worked.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const staff = await requireStaff();
    if (!staff) return NextResponse.json({ error: "Please sign in to continue" }, { status: 401 });
    const { supabase, user } = staff;

    const {
      full_name, phone, father_name, address, gender, timing, payment_type,
      membership_plan, monthly_fee, join_date, next_due_date, notes,
      cash_amount, upi_amount,
    } = body;

    if (!full_name || !phone || !membership_plan) {
      return NextResponse.json({ error: "Name, phone and membership plan are required" }, { status: 400 });
    }

    const method = payment_type || "UPI";
    const isMixedPayment = method === "UPI + Cash" || method === "Half UPI + Half Cash";
    const amount = Number(monthly_fee);
    const cashAmount = isMixedPayment ? Number(cash_amount ?? 0) : method === "Cash" ? amount : 0;
    const upiAmount = isMixedPayment ? Number(upi_amount ?? 0) : method === "UPI" ? amount : 0;

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Enter a valid membership fee" }, { status: 400 });
    }
    if (isMixedPayment && (!Number.isFinite(cashAmount) || !Number.isFinite(upiAmount) || cashAmount <= 0 || upiAmount <= 0 || Math.abs(cashAmount + upiAmount - amount) > 0.01)) {
      return NextResponse.json(
        { error: "Cash and UPI amounts must both be positive and add up to the fee" },
        { status: 400 },
      );
    }

    const joinDate = join_date || new Date().toISOString().slice(0, 10);

    // Resolve the open collection period BEFORE creating anything. If the books
    // are not open for business there is no point half-registering someone.
    const { data: openPeriod } = await supabase
      .from("collection_periods")
      .select("id")
      .eq("status", "open")
      .order("opened_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let period = openPeriod;

    if (!period) {
      const periodKey = new Date().toISOString().slice(0, 7);
      // Another desk may open the same month concurrently, so treat a duplicate
      // period_key as success and re-read rather than failing the admission.
      const { data: newPeriod } = await supabase
        .from("collection_periods")
        .insert({ period_key: periodKey, status: "open" })
        .select("id")
        .maybeSingle();

      if (newPeriod) {
        period = newPeriod;
      } else {
        const { data: retryPeriod } = await supabase
          .from("collection_periods")
          .select("id")
          .eq("status", "open")
          .order("opened_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        period = retryPeriod;
      }
    }

    if (!period) {
      return NextResponse.json(
        { error: "No collection month is open, so the registration fee cannot be recorded. Ask an administrator to open the current month, then try again." },
        { status: 409 },
      );
    }

    const { data: member, error: memberError } = await supabase
      .from("members")
      .insert({
        full_name,
        phone,
        father_name: father_name || null,
        address: address || null,
        gender: gender || null,
        timing: timing || "Morning",
        payment_type: method,
        membership_plan,
        monthly_fee: amount,
        join_date: joinDate,
        next_due_date: next_due_date || joinDate,
        notes: notes || null,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (memberError || !member) {
      return NextResponse.json({ error: memberError?.message ?? "Unable to add member" }, { status: 500 });
    }

    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        member_id: member.id,
        amount,
        payment_method: method,
        cash_amount: cashAmount,
        upi_amount: upiAmount,
        fee_category: "registration",
        payment_date: joinDate,
        notes: "Registration fee",
        period_id: period.id,
        recorded_by: user.id,
      })
      .select("*")
      .single();

    if (paymentError || !payment) {
      // Keep the books consistent: no orphan member without their joining fee.
      await supabase.from("members").delete().eq("id", member.id);
      console.error("REGISTRATION FEE INSERT ERROR:", paymentError);
      return NextResponse.json(
        { error: `The admission was not saved because the registration fee could not be recorded: ${paymentError?.message ?? "unknown error"}` },
        { status: 500 },
      );
    }

    const nextDue = advanceDueDate(joinDate, membership_plan, joinDate);
    await supabase.from("members").update({ next_due_date: nextDue }).eq("id", member.id);

    return NextResponse.json(
      { member, payment, next_due_date: nextDue, recorded_by_role: staff.role },
      { status: 201 },
    );
  } catch (error) {
    console.error("MEMBER CREATION ERROR:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
