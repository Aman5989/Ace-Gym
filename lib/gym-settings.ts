import { createClient } from "@/lib/supabase-server";

export async function getHeroImageUrl() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("gym_settings")
    .select("hero_image_url")
    .eq("id", "main")
    .maybeSingle();
  return data?.hero_image_url ?? null;
}
