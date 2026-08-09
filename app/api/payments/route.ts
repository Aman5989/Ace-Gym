import { NextRequest, NextResponse } from "next/server";

import { createClient as createServerClient } from "@/lib/supabase-server";
import { advanceDueDate } from "@/lib/payment-utils";

export async function GET(request: NextRequest) {
  const memberId = request.nextUrl.searchParams.get("member_id");

  if (!memberId) {
    return NextResponse.json({ error: "member_id is required" }, { status: 400 });
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("member_id", memberId)
    .order("payment_date", { ascending: false })
    .order("created_at", { ascending: false });

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

    if (!memberId || !Number.isFinite(amount) || amount <= 0 || !paymentDate) {
      return NextResponse.json(
        { error: "member_id, a positive amount, and payment_date are required" },
        { status: 400 },
      );
    }

    const supabase = await createServerClient();
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
        payment_date: paymentDate,
        notes,
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
