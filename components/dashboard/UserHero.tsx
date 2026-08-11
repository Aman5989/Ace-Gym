import { Phone, ShieldCheck, User } from "lucide-react";

interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface Props {
  user: { email?: string | null } | null;
  profile: UserProfile | null;
  role: "admin" | "trainer";
}

export default function UserHero({ user, profile, role }: Props) {
  const displayName = profile?.full_name || user?.email?.split("@")[0] || (role === "admin" ? "Administrator" : "Trainer");

  if (role === "admin") {
    return (
      <section
        aria-label="Administrator dashboard"
        className="ace-glass ace-reveal relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0a0e27] via-[#111740] to-[#1a0d33] p-6 shadow-2xl md:p-8"
      >
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">ACE Gym</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white md:text-4xl">Admin Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Manage trainer names, phone numbers, and photos from <strong className="text-white">Access control</strong> below. Trainer dashboards are read-only.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-violet-300/20 bg-violet-400/10 px-4 py-3 text-violet-100">
            <ShieldCheck className="h-5 w-5 text-violet-300" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Signed in as administrator</p>
              <p className="max-w-56 truncate text-sm text-violet-200">{user?.email || "Administrator"}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Trainer details"
      className="ace-glass ace-reveal relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0a0e27] via-[#111740] to-[#1a0d33] p-6 shadow-2xl md:p-8"
    >
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative flex flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-400/80">Trainer Details</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">{displayName}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-slate-300">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-amber-400/70" />
              <span className="text-sm font-bold">Trainer</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-amber-400/70" />
              <span className="text-sm font-medium">{profile?.phone || "Phone number not available"}</span>
            </div>
          </div>

          <p className="mt-5 text-sm text-slate-400">Your details are managed by an administrator.</p>
        </div>

        <div className="h-36 w-36 shrink-0 overflow-hidden rounded-3xl border border-white/15 bg-white/5 shadow-2xl">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={`${displayName}'s profile`} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-700">
              <User className="h-16 w-16" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
