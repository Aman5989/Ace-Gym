import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      full_name,
      phone,
      father_name,
      address,
      gender,
      membership_plan,
      monthly_fee,
      join_date,
      next_due_date,
      payment_type,
      notes,
    } = body;

    if (!full_name || !phone || !membership_plan) {
      return NextResponse.json(
        {
          error: "Required fields missing",
        },
        {
          status: 400,
        }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("members")
      .insert({
        full_name,
        phone,
        father_name: father_name || null,
        address: address || null,
        gender: gender || null,
        membership_plan,
        monthly_fee: Number(monthly_fee),
        join_date,
        next_due_date,
        payment_type: payment_type || "UPI",
        notes: notes || null,
      });

    if (error) {
      console.error(error);

      return NextResponse.json(
        {
          error: "Failed to register member",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Registration completed",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Server error",
      },
      {
        status: 500,
      }
    );
  }
}
