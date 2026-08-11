"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, UserCog, Users, Edit2 } from "lucide-react";
import UserProfileEditor from "./UserProfileEditor";
import { createClient } from "@/lib/supabase";

type UserProfile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
};

type RoleRecord = {
  user_id: string;
  email: string;
  role: "admin" | "trainer";
  created_at: string | null;
  profile?: UserProfile | null;
};

type RoleApiRecord = Omit<RoleRecord, "profile">;

export default function RoleManagement() {
  const supabase = createClient();
  const [users, setUsers] = useState<RoleRecord[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "trainer">("trainer");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [editingUser, setEditingUser] = useState<RoleRecord | null>(null);

  async function loadUsers() {
    setLoading(true);
    try {
      const response = await fetch("/api/user-roles", { cache: "no-store" });
      const payload = await response.json();
      
      if (response.ok) {
        const roles = (payload.users ?? []) as RoleApiRecord[];
        
        // Fetch profiles for these users in parallel.
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .in("id", roles.map((user) => user.user_id));
        const profiles = (data ?? []) as UserProfile[];

        const usersWithProfiles: RoleRecord[] = roles.map((user) => ({
          ...user,
          profile: profiles.find((profile) => profile.id === user.user_id) ?? null,
        }));

        setUsers(usersWithProfiles);
      } else {
        setMessage(payload.error ?? "Unable to load roles");
      }
    } catch {
      setMessage("Error loading user data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadUsers(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function saveRole(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/user-roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    const payload = await response.json();
    if (!response.ok) setMessage(payload.error ?? "Unable to update role");
    else {
      setMessage("Role updated successfully.");
      setEmail("");
      await loadUsers();
    }
    setSaving(false);
  }

  return (
    <section id="role-management-section" className="ace-panel rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/20 sm:p-7">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Access control</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Team roles</h2>
          <p className="mt-1 text-sm text-slate-400">Assign access and manage trainer names, phone numbers, and photos. Trainer dashboards are read-only.</p>
        </div>
        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-cyan-200">
          <ShieldCheck className="h-6 w-6" />
        </div>
      </div>

      <form onSubmit={saveRole} className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Registered account email"
          required
          className="h-11 rounded-xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/60"
        />
        <select value={role} onChange={(event) => setRole(event.target.value as "admin" | "trainer")} className="h-11 rounded-xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none focus:border-cyan-300/60">
          <option value="trainer">Trainer</option>
          <option value="admin">Admin</option>
        </select>
        <button disabled={saving} className="h-11 rounded-xl bg-cyan-300 px-5 text-sm font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60">
          {saving ? "Saving…" : "Save role"}
        </button>
      </form>
      {message ? <p className="mt-3 text-sm text-cyan-200">{message}</p> : null}

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
        <div className="grid grid-cols-[1fr_110px_40px] gap-3 border-b border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <span>Account</span><span>Role</span><span className="text-right">Details</span>
        </div>
        {loading ? <p className="px-4 py-5 text-sm text-slate-400">Loading roles…</p> : users.length === 0 ? <p className="px-4 py-5 text-sm text-slate-400">No registered accounts found.</p> : users.map((user) => (
          <div key={user.user_id} className="grid grid-cols-[1fr_110px_40px] items-center gap-3 border-b border-white/5 px-4 py-3 last:border-b-0">
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-9 w-9 shrink-0 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
                {user.profile?.avatar_url ? (
                  <img src={user.profile.avatar_url} alt="" className="h-full w-full rounded-xl object-cover" />
                ) : (
                  <Users className="h-4 w-4 text-slate-500" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="truncate text-sm font-semibold text-slate-200">{user.email}</span>
                <div className="flex items-center gap-2 overflow-hidden">
                  {user.profile?.full_name && <span className="text-[10px] text-amber-400/80 truncate font-medium">{user.profile.full_name}</span>}
                  <span className="text-[8px] font-mono text-slate-600 truncate opacity-60">ID: {user.user_id}</span>
                </div>
              </div>
            </div>
            <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${user.role === "admin" ? "bg-violet-400/15 text-violet-200" : "bg-emerald-400/15 text-emerald-200"}`}><UserCog className="h-3.5 w-3.5" />{user.role}</span>
            {user.role === "trainer" ? (
              <button
                onClick={() => setEditingUser(user)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white/5 hover:text-amber-400 transition-colors"
                title="Edit trainer details"
                aria-label={`Edit trainer details for ${user.email}`}
              >
                <Edit2 className="h-4 w-4" />
              </button>
            ) : (
              <span aria-label="Administrator profile is not editable here" />
            )}
          </div>
        ))}
      </div>

      {editingUser && (
        <UserProfileEditor 
          userId={editingUser.user_id} 
          email={editingUser.email} 
          initialProfile={editingUser.profile || null} 
          onClose={() => {
            setEditingUser(null);
            void loadUsers();
          }} 
        />
      )}
    </section>
  );
}
