"use client";

import { useRef, useState } from "react";
import { Check, Edit2, Loader2, Phone, Trash2, Upload, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";

export interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  description: string | null;
  updated_at?: string;
}

export interface TrainerHeroOption {
  userId: string;
  email: string;
  profile: UserProfile | null;
}

interface Props {
  user: { id?: string; email?: string | null } | null;
  profile: UserProfile | null;
  role: "admin" | "trainer";
  trainerOptions?: TrainerHeroOption[];
}

export default function UserHero({ user, profile, role, trainerOptions = [] }: Props) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAdmin = role === "admin";
  const initialTrainer = trainerOptions.find((option) => option.profile?.id === profile?.id) ?? trainerOptions[0];
  const initialProfile = isAdmin ? (initialTrainer?.profile ?? null) : profile;
  const initialProfileId = isAdmin ? (initialTrainer?.userId ?? "") : (user?.id ?? "");

  const [selectedTrainerId, setSelectedTrainerId] = useState(initialProfileId);
  const [localProfile, setLocalProfile] = useState<UserProfile | null>(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: initialProfile?.full_name ?? "",
    phone: initialProfile?.phone ?? "",
    description: initialProfile?.description ?? "",
  });

  const selectedTrainer = trainerOptions.find((option) => option.userId === selectedTrainerId);
  const targetUserId = isAdmin ? selectedTrainerId : user?.id;
  const canEdit = isAdmin && Boolean(targetUserId);
  const displayName = localProfile?.full_name || selectedTrainer?.email?.split("@")[0] || user?.email?.split("@")[0] || "Trainer";
  const firstName = displayName.trim().split(/\s+/)[0] || "Trainer";

  function selectTrainer(trainerId: string) {
    const nextTrainer = trainerOptions.find((option) => option.userId === trainerId);
    const nextProfile = nextTrainer?.profile ?? null;

    setSelectedTrainerId(trainerId);
    setLocalProfile(nextProfile);
    setFormData({
      full_name: nextProfile?.full_name ?? "",
      phone: nextProfile?.phone ?? "",
      description: nextProfile?.description ?? "",
    });
    setIsEditing(false);
  }

  async function saveProfile() {
    if (!canEdit || !targetUserId) return;

    setLoading(true);
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: targetUserId,
          full_name: formData.full_name,
          phone: formData.phone,
          avatar_url: localProfile?.avatar_url ?? null,
          description: formData.description,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to save trainer details");

      setLocalProfile(result.saved);
      setIsEditing(false);
      toast.success("Trainer details updated");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to save trainer details");
    } finally {
      setLoading(false);
    }
  }

  async function uploadPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    if (!canEdit || !targetUserId) return;
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const extension = file.name.split(".").pop() || "jpg";
      const filePath = `${targetUserId}/${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: targetUserId,
          full_name: formData.full_name,
          phone: formData.phone,
          avatar_url: publicUrlData.publicUrl,
          description: formData.description,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to save trainer photo");

      setLocalProfile(result.saved);
      toast.success("Trainer photo updated");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Photo upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function removePhoto() {
    if (!canEdit || !targetUserId || !localProfile?.avatar_url) return;

    setUploading(true);
    try {
      const marker = "/storage/v1/object/public/avatars/";
      const markerIndex = localProfile.avatar_url.indexOf(marker);
      if (markerIndex >= 0) {
        const storagePath = decodeURIComponent(localProfile.avatar_url.slice(markerIndex + marker.length));
        const { error: removeError } = await supabase.storage.from("avatars").remove([storagePath]);
        if (removeError) throw removeError;
      }

      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: targetUserId,
          full_name: formData.full_name,
          phone: formData.phone,
          avatar_url: null,
          description: formData.description,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to remove trainer photo");

      setLocalProfile(result.saved);
      toast.success("Trainer photo removed");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Photo removal failed");
    } finally {
      setUploading(false);
    }
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
            ACE<span className="text-white">々</span>{firstName}
          </p>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">Trainer</p>

          {isAdmin && trainerOptions.length > 0 && (
            <div className="mt-4 max-w-md space-y-1.5">
              <label htmlFor="hero-trainer-select" className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Trainer profile</label>
              <select
                id="hero-trainer-select"
                value={selectedTrainerId}
                onChange={(event) => selectTrainer(event.target.value)}
                className="h-10 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white outline-none focus:border-amber-400/60"
              >
                {trainerOptions.map((option) => (
                  <option key={option.userId} value={option.userId}>{option.profile?.full_name || option.email}</option>
                ))}
              </select>
            </div>
          )}

          {isEditing ? (
            <div className="mt-4 max-w-md space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="space-y-1.5">
                <label htmlFor="trainer-full-name" className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Name</label>
                <Input
                  id="trainer-full-name"
                  value={formData.full_name}
                  onChange={(event) => setFormData({ ...formData, full_name: event.target.value })}
                  className="h-10 rounded-xl border-white/10 bg-white/5 text-white"
                  placeholder="Enter trainer name"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="trainer-phone" className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Phone number</label>
                <Input
                  id="trainer-phone"
                  value={formData.phone}
                  onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                  className="h-10 rounded-xl border-white/10 bg-white/5 text-white"
                  placeholder="Enter trainer phone number"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="trainer-description" className="text-[10px] font-bold uppercase tracking-wider text-slate-500">About the trainer</label>
                <Textarea
                  id="trainer-description"
                  value={formData.description}
                  onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                  className="min-h-24 resize-y rounded-xl border-white/10 bg-white/5 text-white"
                  placeholder="Write 3–4 lines about this trainer"
                  rows={4}
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
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        full_name: localProfile?.full_name ?? "",
                        phone: localProfile?.phone ?? "",
                        description: localProfile?.description ?? "",
                      });
                      setIsEditing(true);
                    }}
                    className="rounded-full p-2 text-slate-500 transition-colors hover:bg-white/5 hover:text-amber-400"
                    title="Edit trainer details"
                    aria-label="Edit trainer details"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2 text-slate-300">
                <Phone className="h-4 w-4 text-amber-400/70" />
                <span className="text-sm font-medium">{localProfile?.phone || "Phone number not available"}</span>
              </div>
              <p className="mt-4 max-w-xl whitespace-pre-line text-sm leading-6 text-slate-400">
                {localProfile?.description || "Trainer description will appear here."}
              </p>
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
          {isAdmin && (
            <div className="mt-3 flex w-full gap-2">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={uploadPhoto} className="hidden" />
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || !targetUserId}
                className="h-8 flex-1 rounded-xl border border-white/10 bg-white/10 text-white backdrop-blur hover:bg-white/20"
                title="Upload trainer photo"
                aria-label="Upload trainer photo"
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
                  title="Delete trainer photo"
                  aria-label="Delete trainer photo"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
