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

    console.log(`[API] Fixed Save: ID ${userId} by ${currentUser.email}`);

    const supabase = await createClient();
    
    // Call the v3 RPC that avoids ambiguous ID references
    const { data, error } = await supabase.rpc("master_update_profile_v3", {
      target_user_id: userId,
      new_full_name: full_name,
      new_phone: phone,
      new_avatar_url: avatar_url
    });

    if (error) {
      console.error(`[API] RPC Error:`, error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Map the renamed DB columns back to the standard profile format
    const dbRow = data?.[0];
    const savedRecord = dbRow ? {
      id: dbRow.profile_id,
      full_name: dbRow.profile_name,
      phone: dbRow.profile_phone,
      avatar_url: dbRow.profile_avatar,
      updated_at: dbRow.profile_updated_at
    } : null;

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
