import { createClient } from "@/lib/supabase-server";

export type AppRole = "admin" | "trainer";

const PRIMARY_ADMIN_EMAIL = "shubham@acegym.com";

export async function getCurrentAppUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, role: null as AppRole | null };

  const { data: roleRecord } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  const role: AppRole = roleRecord?.role === "admin"
    ? "admin"
    : user.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL
      ? "admin"
      : "trainer";
  return { supabase, user, role };
}

export async function requireAdmin() {
  const context = await getCurrentAppUser();
  if (!context.user || context.role !== "admin") return null;
  return context;
}
