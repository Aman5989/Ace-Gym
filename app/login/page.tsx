"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function passwordScore(password: string) {
  return [password.length >= 8, password.length >= 12, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "change">("login");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  function resetChangeFields() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Login successful");
      router.push("/admin");
      router.refresh();
    } catch {
      toast.error("Unable to sign in right now.");
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email) {
      toast.error("Enter your admin email.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Use at least 8 characters for your new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match.");
      return;
    }
    if (newPassword === currentPassword) {
      toast.error("Your new password must be different.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: reauthError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
      if (reauthError) {
        toast.error("Current password is incorrect.");
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Password changed successfully. You can now sign in with it.");
      resetChangeFields();
      setMode("login");
    } catch {
      toast.error("Unable to change your password right now.");
    } finally {
      setLoading(false);
    }
  }

  const score = passwordScore(newPassword);
  const strengthLabel = score <= 2 ? "Needs improvement" : score <= 4 ? "Good" : "Strong";
  const strengthColor = score <= 2 ? "bg-rose-500" : score <= 4 ? "bg-amber-400" : "bg-emerald-400";

  return (
    <main className="ace-shell relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-[#05071a] via-[#0a0e27] to-[#100828] px-4 py-10">
      <div aria-hidden className="ace-grid-overlay pointer-events-none absolute inset-0 opacity-60" />
      <div aria-hidden className="ace-float pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-24 bottom-1/4 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />

      {loading ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 px-4 backdrop-blur-md">
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/10 px-10 py-8 text-center shadow-2xl">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 shadow-lg shadow-amber-500/25">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
            </div>
            <div>
              <p className="font-semibold text-white">Entering ACE々GYM</p>
              <p className="mt-1 text-sm text-slate-300">Preparing your dashboard…</p>
            </div>
          </div>
        </div>
      ) : null}

      <form onSubmit={mode === "login" ? handleLogin : handleChangePassword} className="ace-glass ace-shimmer ace-reveal relative w-full max-w-md space-y-5 rounded-3xl border border-white/10 p-8 shadow-2xl shadow-black/40">
        <div className="ace-reveal ace-reveal-1">
          <div className="mb-4 flex items-center gap-3">
            <img src="/acegym-icon.png" alt="ACE々GYM logo" className="ace-float h-12 w-auto drop-shadow-[0_2px_8px_rgba(251,191,36,0.45)]" />
            <h1 className="text-3xl font-black tracking-tight text-white">ACE<span className="text-amber-400">々</span>GYM</h1>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300/80">{mode === "login" ? "Administrator sign in" : "Update password"}</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">{mode === "login" ? "Manage your members, payments, and daily operations." : "Create a new password for your administrator account."}</p>
        </div>

        <div className="ace-reveal ace-reveal-2">
          <label className="text-sm font-medium text-slate-300">Email address</label>
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required autoComplete="email" className="ace-focus-ring mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20" />
        </div>

        <div className="ace-reveal ace-reveal-3">
          <label className="text-sm font-medium text-slate-300">{mode === "login" ? "Password" : "Current password"}</label>
          <input value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} type="password" required autoComplete={mode === "login" ? "current-password" : "current-password"} className="ace-focus-ring mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20" />
        </div>

        {mode === "change" && (
          <>
            <div className="ace-reveal ace-reveal-3">
              <label className="text-sm font-medium text-slate-300">New password</label>
              <input value={newPassword} onChange={(event) => setNewPassword(event.target.value)} type="password" required autoComplete="new-password" className="ace-focus-ring mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20" />
              <div className="mt-3 flex gap-1.5" aria-label={`Password strength: ${strengthLabel}`}>
                {[0, 1, 2, 3, 4].map((item) => <span key={item} className={`h-1.5 flex-1 rounded-full ${item < score ? strengthColor : "bg-white/10"}`} />)}
              </div>
              <p className="mt-2 text-xs text-slate-500">{newPassword ? strengthLabel : "Use 8+ characters with a number and symbol."}</p>
            </div>
            <div className="ace-reveal ace-reveal-4">
              <label className="text-sm font-medium text-slate-300">Confirm new password</label>
              <input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" required autoComplete="new-password" className="ace-focus-ring mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20" />
            </div>
          </>
        )}

        <button type="submit" disabled={loading} className="ace-reveal ace-reveal-4 ace-focus-ring group relative h-11 w-full overflow-hidden rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 font-bold text-slate-950 shadow-lg shadow-amber-500/30 transition-all hover:from-amber-300 hover:to-orange-400 disabled:opacity-50">
          <span className="relative z-10 flex items-center justify-center gap-2">
            {loading && <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />}
            {loading ? (mode === "login" ? "Signing in..." : "Changing password...") : mode === "login" ? "Sign in" : "Change password"}
          </span>
        </button>

        <div className="flex items-center justify-center gap-2 text-xs">
          <span className="text-slate-500">{mode === "login" ? "Need to update your password?" : "Remember your password?"}</span>
          <button type="button" onClick={() => { setMode(mode === "login" ? "change" : "login"); resetChangeFields(); }} className="ace-focus-ring font-semibold text-amber-300 transition-colors hover:text-amber-200">
            {mode === "login" ? "Change password" : "Return to sign in"}
          </button>
        </div>

        <p className="pt-1 text-center text-xs text-slate-500">Authorized staff access only</p>
      </form>
    </main>
  );
}
