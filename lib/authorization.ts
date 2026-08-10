import { createClient } from "@/lib/supabase-server";

export type AppRole = "admin" | "trainer";

export async function getCurrentAppUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      user: null,
      role: null as AppRole | null,
    };
  }

  const { data: roleRecord, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !roleRecord) {
    return {
      supabase,
      user,
      role: null as AppRole | null,
    };
  }

  const role =
    roleRecord.role === "admin" || roleRecord.role === "trainer"
      ? (roleRecord.role as AppRole)
      : null;

  return {
    supabase,
    user,
    role,
  };
}

export async function requireAdmin() {
  const context = await getCurrentAppUser();

  if (!context.user || context.role !== "admin") {
    return null;
  }

  return context;
}