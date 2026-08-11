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

    console.log(`[API] Triple-Check Update: Target ${userId} | Caller ${currentUser.email}`);

    const supabase = await createClient();
    
    // Call the Triple-Check RPC
    const { data: status, error } = await supabase.rpc("triple_check_update_profile", {
      target_id: userId,
      new_name: full_name,
      new_phone: phone,
      new_avatar: avatar_url
    });

    if (error) {
      console.error(`[API] Triple-Check RPC Error:`, error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log(`[API] Profile ${status} for ${userId}`);

    // Clear all possible Next.js caches
    revalidatePath("/admin");
    revalidatePath("/");

    return new NextResponse(JSON.stringify({ success: true, status }), {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error("PROFILE UPDATE FATAL ERROR:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
