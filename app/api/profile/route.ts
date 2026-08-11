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

    console.log(`[API] Profile Update Request for ID: ${userId}`);

    // Security check: Only admins can update other users' profiles
    if (userId !== currentUser.id && role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = await createClient();
    
    // Explicit two-step process to ensure Insert works correctly under RLS
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    let result;
    if (existing) {
      console.log(`[API] Updating existing profile for ${userId}`);
      result = await supabase
        .from("profiles")
        .update({
          full_name,
          phone,
          avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
    } else {
      console.log(`[API] Inserting new profile for ${userId}`);
      result = await supabase
        .from("profiles")
        .insert({
          id: userId,
          full_name,
          phone,
          avatar_url,
          updated_at: new Date().toISOString(),
        });
    }

    if (result.error) {
      console.error(`[API] Supabase Error:`, result.error);
      throw result.error;
    }

    // Revalidate the admin and home paths to clear server-side cache
    revalidatePath("/admin");
    revalidatePath("/");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PROFILE UPDATE ERROR:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
