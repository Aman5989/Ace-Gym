import { cache } from "react";
import { createClient } from "@/lib/supabase-server";

export type AppRole = "admin" | "trainer";

const PRIMARY_ADMIN_EMAIL = "shubham@acegym.com";

export async function getCurrentAppUser() {
  const supabase = await createClient();
  
  // Use getUser for security and fresh session data
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, role: null as AppRole | null, profile: null };
  const normalizedEmail = (user.email ?? user.user_metadata?.email ?? "").trim().toLowerCase();
  
  // Fetch profile and role in parallel
  let [roleResult, profileResult] = await Promise.all([
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
  ]);

  // Profile check: The trigger should have created this, but we'll return null if missing
  // to avoid accidental overwrites from the client side.
  if (!profileResult.data) {
    console.warn(`[AUTH] Profile missing for ${user.email} (${user.id}). Check database trigger.`);
  }

  let role: AppRole = roleResult.data?.role === "admin" ? "admin" : "trainer";
  
  // Keep the initial administrator available while role-table RLS is being repaired.
  if (normalizedEmail === PRIMARY_ADMIN_EMAIL) {
    role = "admin";
  }

  return { supabase, user, role, profile: profileResult.data };
}

export async function requireAdmin() {
  const context = await getCurrentAppUser();
  if (!context.user || context.role !== "admin") return null;
  return context;
}
