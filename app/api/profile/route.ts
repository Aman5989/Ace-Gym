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

    console.log(`[API] Profile Update Request: Saving to ID ${userId} by Admin ${currentUser.email}`);

    // Security check: Only admins can update other users' profiles
    if (userId !== currentUser.id && role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = await createClient();
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
      throw error;
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
