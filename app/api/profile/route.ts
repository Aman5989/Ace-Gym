import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authorization";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, full_name, phone, avatar_url } = body;

    if (
      typeof userId !== "string" ||
      typeof full_name !== "string" ||
      typeof phone !== "string" ||
      (avatar_url !== null && typeof avatar_url !== "string")
    ) {
      return NextResponse.json({ error: "Invalid profile update payload" }, { status: 400 });
    }

    const supabase = admin.supabase;

    // Use the v3 RPC, whose unambiguous return-column names avoid PostgreSQL ID collisions.
    const { data, error } = await supabase.rpc("master_update_profile_v3", {
      target_user_id: userId,
      new_full_name: full_name,
      new_phone: phone,
      new_avatar_url: avatar_url,
    });

    if (error) {
      console.error("Profile update RPC error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const dbRow = Array.isArray(data) ? data[0] : data;
    const savedRecord = dbRow
      ? {
          id: dbRow.profile_id,
          full_name: dbRow.profile_name,
          phone: dbRow.profile_phone,
          avatar_url: dbRow.profile_avatar,
          updated_at: dbRow.profile_updated_at,
        }
      : null;

    if (!savedRecord || savedRecord.id !== userId) {
      console.error("Profile update did not return the requested account record", {
        requestedId: userId,
        returnedId: savedRecord?.id ?? null,
      });
      return NextResponse.json(
        { error: "Profile update could not be verified for the selected account" },
        { status: 502 }
      );
    }

    // Invalidate the dashboard route so its server-rendered profile is fresh on the next visit.
    revalidatePath("/admin");
    revalidatePath("/");

    return NextResponse.json(
      {
        success: true,
        targetId: userId,
        saved: savedRecord,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error: unknown) {
    console.error("Profile update fatal error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
