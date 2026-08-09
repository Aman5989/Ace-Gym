import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/authorization";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });

  const { data, error } = await admin.supabase.rpc("admin_list_user_roles");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: data ?? [] });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });

  const body = await request.json();
  const email = String(body.email ?? "").trim().toLowerCase();
  const role = String(body.role ?? "").trim().toLowerCase();
  if (!email || !["admin", "trainer"].includes(role)) {
    return NextResponse.json({ error: "A valid email and role are required" }, { status: 400 });
  }

  const { data, error } = await admin.supabase.rpc("admin_set_user_role", {
    target_email: email,
    target_role: role,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ user: data });
}
