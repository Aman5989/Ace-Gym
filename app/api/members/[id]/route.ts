import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/authorization";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if (!auth) {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
  }

  const { error } = await auth.supabase.from("members").delete().eq("id", id);
  if (error) {
    console.error("MEMBER DELETE ERROR:", error);
    return NextResponse.json({ error: "Unable to delete member" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
