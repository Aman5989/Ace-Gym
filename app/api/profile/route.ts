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

    console.log(`[API] Master Access Save: ID ${userId} by ${currentUser.email}`);

    const supabase = await createClient();
    
    // Call the Master Access RPC that returns the saved data
    const { data, error } = await supabase.rpc("master_update_profile_v2", {
      target_id: userId,
      new_name: full_name,
      new_phone: phone,
      new_avatar: avatar_url
    });

    if (error) {
      console.error(`[API] RPC Error:`, error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const savedRecord = data?.[0];
    console.log(`[API] DB VERIFIED:`, savedRecord);

    // Clear all possible Next.js caches
    revalidatePath("/admin");
    revalidatePath("/");

    return new NextResponse(JSON.stringify({ 
      success: true, 
      saved: savedRecord 
    }), {
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
