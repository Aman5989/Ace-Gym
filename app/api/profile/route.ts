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

    // Security check: Only admins can update other users' profiles
    if (userId !== currentUser.id && role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = await createClient();
    
    // Use a direct upsert now that RLS recursion is fixed
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        full_name,
        phone,
        avatar_url,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error(`[API] Supabase Upsert Error:`, error);
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
