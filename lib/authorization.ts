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

  // AUTO-FIX: If no profile exists, create one immediately using the service role or upsert
  // Since this is a server component, we'll try to ensure it exists.
  if (!profileResult.data) {
    console.log(`[AUTH] Auto-creating profile for ${user.email} (${user.id})`);
    const { data: newProfile } = await supabase
      .from("profiles")
      .upsert({ 
        id: user.id, 
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || "ACE Trainer",
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (newProfile) {
      profileResult.data = newProfile;
    }
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
