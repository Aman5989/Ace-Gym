import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getCurrentAppUser } from "@/lib/authorization";

const BUCKET = "gym-assets";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function DELETE() {
  const { role } = await getCurrentAppUser();
  if (role !== "admin") {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: settings, error: settingsReadError } = await supabase
    .from("gym_settings")
    .select("hero_image_url")
    .eq("id", "main")
    .maybeSingle();

  if (settingsReadError) {
    return NextResponse.json({ error: settingsReadError.message }, { status: 500 });
  }

  if (settings?.hero_image_url) {
    try {
      const imageUrl = new URL(settings.hero_image_url);
      const marker = `/storage/v1/object/public/${BUCKET}/`;
      const markerIndex = imageUrl.pathname.indexOf(marker);
      if (markerIndex >= 0) {
        const path = decodeURIComponent(imageUrl.pathname.slice(markerIndex + marker.length));
        if (path) await supabase.storage.from(BUCKET).remove([path]);
      }
    } catch {
      // Clearing the setting remains safe even if an older URL cannot be parsed.
    }
  }

  const { error: settingsError } = await supabase
    .from("gym_settings")
    .upsert({ id: "main", hero_image_url: null, updated_at: new Date().toISOString() });

  if (settingsError) {
    return NextResponse.json({ error: settingsError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function POST(request: Request) {
  const { role } = await getCurrentAppUser();
  if (role !== "admin") {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Please select an image" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Image must be smaller than 5 MB" }, { status: 400 });
  }

  const supabase = await createClient();
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `dashboard/hero-${Date.now()}.${extension}`;
  const bytes = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: file.type, cacheControl: "3600", upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const { error: settingsError } = await supabase
    .from("gym_settings")
    .upsert({ id: "main", hero_image_url: publicUrl.publicUrl, updated_at: new Date().toISOString() });

  if (settingsError) {
    return NextResponse.json({ error: settingsError.message }, { status: 500 });
  }

  return NextResponse.json({ url: publicUrl.publicUrl });
}
