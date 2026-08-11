"use client";

import { useRef, useState } from "react";
import { Check, Edit2, Loader2, Phone, ShieldCheck, Trash2, Upload, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  updated_at?: string;
}

interface Props {
  user: { id?: string; email?: string | null } | null;
  profile: UserProfile | null;
  role: "admin" | "trainer";
}

export default function UserHero({ user, profile, role }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isTrainer = role === "trainer";

  const [localProfile, setLocalProfile] = useState<UserProfile | null>(profile);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
  });

  const displayName = localProfile?.full_name || user?.email?.split("@")[0] || (isTrainer ? "Trainer" : "Administrator");

  async function saveProfile() {
    if (!isTrainer || !user?.id) return;

    setLoading(true);
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          full_name: formData.full_name,
          phone: formData.phone,
          avatar_url: localProfile?.avatar_url ?? null,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to save profile");

      setLocalProfile(result.saved);
      setIsEditing(false);
      router.refresh();
      toast.success("Your trainer details were updated");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to save profile");
    } finally {
      setLoading(false);
    }
  }

  async function uploadPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    if (!isTrainer || !user?.id) return;
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const extension = file.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const avatarUrl = publicUrlData.publicUrl;
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          full_name: formData.full_name,
          phone: formData.phone,
          avatar_url: avatarUrl,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to save photo");

      setLocalProfile(result.saved);
      router.refresh();
      toast.success("Profile photo updated");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Photo upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function removePhoto() {
    if (!isTrainer || !user?.id || !localProfile?.avatar_url) return;

    setUploading(true);
    try {
      const marker = "/storage/v1/object/public/avatars/";
      const markerIndex = localProfile.avatar_url.indexOf(marker);
      if (markerIndex >= 0) {
        const storagePath = decodeURIComponent(localProfile.avatar_url.slice(markerIndex + marker.length));
        await supabase.storage.from("avatars").remove([storagePath]);
      }

      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          full_name: formData.full_name,
          phone: formData.phone,
          avatar_url: null,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to remove photo");

      setLocalProfile(result.saved);
      router.refresh();
      toast.success("Profile photo removed");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Photo removal failed");
    } finally {
      setUploading(false);
    }
  }

  if (!isTrainer) {
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
            <p className="mt-2 max-w-2xl text-sm text-slate-300">Manage gym operations and account access from this dashboard.</p>
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
        <div className="min-w-0 flex-1 self-stretch">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-400/80">
            ACE<span className="text-white">々</span>Trainer
          </p>

          {isEditing ? (
            <div className="mt-4 max-w-md space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="space-y-1.5">
                <label htmlFor="trainer-full-name" className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Name</label>
                <Input
                  id="trainer-full-name"
                  value={formData.full_name}
                  onChange={(event) => setFormData({ ...formData, full_name: event.target.value })}
                  className="h-10 rounded-xl border-white/10 bg-white/5 text-white"
                  placeholder="Enter your name"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="trainer-phone" className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Phone number</label>
                <Input
                  id="trainer-phone"
                  value={formData.phone}
                  onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                  className="h-10 rounded-xl border-white/10 bg-white/5 text-white"
                  placeholder="Enter your phone number"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button onClick={saveProfile} disabled={loading} size="sm" className="h-9 rounded-xl bg-emerald-500 font-bold hover:bg-emerald-600">
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1 h-3.5 w-3.5" />}
                  Save
                </Button>
                <Button onClick={() => setIsEditing(false)} disabled={loading} size="sm" variant="ghost" className="h-9 rounded-xl text-slate-400 hover:text-white">
                  <X className="mr-1 h-3.5 w-3.5" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-3xl font-black tracking-tight text-white md:text-4xl">{displayName}</h1>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      full_name: localProfile?.full_name ?? "",
                      phone: localProfile?.phone ?? "",
                    });
                    setIsEditing(true);
                  }}
                  className="rounded-full p-2 text-slate-500 transition-colors hover:bg-white/5 hover:text-amber-400"
                  title="Edit my trainer details"
                  aria-label="Edit my trainer details"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2 text-slate-300">
                <Phone className="h-4 w-4 text-amber-400/70" />
                <span className="text-sm font-medium">{localProfile?.phone || "Phone number not available"}</span>
              </div>
            </div>
          )}
        </div>

        <div className="w-[160px] shrink-0">
          <div className="group relative aspect-square w-full overflow-hidden rounded-3xl border border-white/15 bg-white/5 shadow-2xl">
            {localProfile?.avatar_url ? (
              <img src={localProfile.avatar_url} alt={`${displayName}'s profile`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-700">
                <User className="h-16 w-16" />
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <Loader2 className="h-7 w-7 animate-spin text-amber-400" />
              </div>
            )}
          </div>
          <div className="mt-3 flex w-full gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={uploadPhoto} className="hidden" />
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="h-8 flex-1 rounded-xl border border-white/10 bg-white/10 text-white backdrop-blur hover:bg-white/20"
              title="Upload photo"
              aria-label="Upload photo"
            >
              <Upload className="h-3.5 w-3.5" />
            </Button>
            {localProfile?.avatar_url && (
              <Button
                type="button"
                onClick={removePhoto}
                disabled={uploading}
                variant="outline"
                className="h-8 flex-1 rounded-xl border-red-500/20 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                title="Delete photo"
                aria-label="Delete photo"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
