import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getCurrentAppUser } from "@/lib/authorization";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  try {
    const { user: currentUser, role } = await getCurrentAppUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, full_name, phone, avatar_url } = body;

    console.log(`[API] Profile Update Request: Target ID ${userId} | Caller ${currentUser.email} (${role})`);

    const supabase = await createClient();
    
    // Call the SECURITY DEFINER RPC to bypass RLS issues
    const { error } = await supabase.rpc("admin_update_user_profile", {
      target_user_id: userId,
      new_full_name: full_name,
      new_phone: phone,
      new_avatar_url: avatar_url
    });

    if (error) {
      console.error(`[API] RPC Error:`, error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log(`[API] Profile updated successfully for ${userId}`);

    // Clear server-side cache
    revalidatePath("/admin");
    revalidatePath("/");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PROFILE UPDATE FATAL ERROR:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
