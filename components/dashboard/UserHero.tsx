"use client";

import { useState, useRef, useEffect } from "react";
import { User, Phone, Upload, Loader2, Camera, Check, X, Edit2, Trash2, RefreshCcw, Fingerprint, Clock, Code } from "lucide-react";
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
  user: any;
  profile: UserProfile | null;
  role: "admin" | "trainer";
}

export default function UserHero({ user, profile, role }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showId, setShowId] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(profile?.updated_at || null);
  
  const [localProfile, setLocalProfile] = useState<UserProfile | null>(profile);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
  });

  // Sync local state when props change
  useEffect(() => {
    if (profile) {
      setLocalProfile(profile);
      setFormData({
        full_name: profile.full_name ?? "",
        phone: profile.phone ?? "",
      });
      setLastSync(profile.updated_at || null);
    }
  }, [profile]);

  const canEdit = role === "admin";

  async function handleRefresh() {
    if (!user?.id) return;
    setRefreshing(true);
    try {
      // Direct query with cache busting timestamp
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setLocalProfile(data);
        setFormData({
          full_name: data.full_name ?? "",
          phone: data.phone ?? "",
        });
        setLastSync(new Date().toLocaleTimeString());
        toast.success("Fresh data loaded from DB");
      } else {
        toast.info("No record found in DB for your ID");
      }
      router.refresh();
    } catch (error: any) {
      toast.error("DB Read failed: " + error.message);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleUpdateProfile() {
    if (!canEdit) return;
    setLoading(true);
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          full_name: formData.full_name,
          phone: formData.phone,
          avatar_url: localProfile?.avatar_url,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to save");
      
      toast.success(`Success: ${result.status || 'Saved'}`);
      setIsEditing(false);
      router.refresh();
      setTimeout(() => void handleRefresh(), 800);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    if (!canEdit) return;
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          full_name: formData.full_name,
          phone: formData.phone,
          avatar_url: publicUrl,
        }),
      });

      if (!response.ok) throw new Error("Failed to link photo");

      toast.success("Photo persisted to DB");
      router.refresh();
      setTimeout(() => void handleRefresh(), 800);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleAvatarRemove() {
    if (!canEdit || !localProfile?.avatar_url) return;
    setUploading(true);
    try {
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

      if (!response.ok) throw new Error("Failed to remove photo");

      toast.success("Photo removed from DB");
      router.refresh();
      setTimeout(() => void handleRefresh(), 800);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="ace-glass ace-reveal relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0a0e27] via-[#111740] to-[#1a0d33] p-6 shadow-2xl md:p-8">
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative flex flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex-1 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-amber-400/80">
                ACE<span className="text-white">々</span>Trainer
              </h2>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="rounded-full p-1 text-slate-500 transition-colors hover:bg-white/5 hover:text-amber-400"
                  title="Force DB Read"
                >
                  <RefreshCcw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
                <button 
                  onClick={() => setShowId(!showId)}
                  className="rounded-full p-1 text-slate-500 transition-colors hover:bg-white/5 hover:text-cyan-400"
                  title="View ID"
                >
                  <Fingerprint className="h-3 w-3" />
                </button>
                <button 
                  onClick={() => setShowRaw(!showRaw)}
                  className="rounded-full p-1 text-slate-500 transition-colors hover:bg-white/5 hover:text-emerald-400"
                  title="View Raw Data"
                >
                  <Code className="h-3 w-3" />
                </button>
              </div>
              {lastSync && (
                <div className="flex items-center gap-1 text-[9px] text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">
                  <Clock className="h-2.5 w-2.5" />
                  Synced: {lastSync.includes('T') ? new Date(lastSync).toLocaleTimeString() : lastSync}
                </div>
              )}
            </div>
            
            {showId && (
              <p className="text-[9px] font-mono text-slate-500 break-all bg-black/30 p-1.5 rounded-lg border border-white/5 mt-2">
                UID: {user.id}
              </p>
            )}

            {showRaw && (
              <pre className="text-[8px] font-mono text-emerald-400/80 break-all bg-black/40 p-2 rounded-lg border border-emerald-500/20 mt-2 max-w-xs overflow-auto">
                {JSON.stringify(localProfile, null, 2)}
              </pre>
            )}

            {isEditing ? (
              <div className="mt-4 space-y-3 max-w-xs">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Full Name</label>
                  <Input 
                    value={formData.full_name} 
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="h-10 rounded-xl border-white/10 bg-white/5 text-white focus:border-amber-400/50"
                    placeholder="Enter Name"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Phone Number</label>
                  <Input 
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="h-10 rounded-xl border-white/10 bg-white/5 text-white focus:border-amber-400/50"
                    placeholder="Enter Phone"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" onClick={handleUpdateProfile} disabled={loading} className="h-9 rounded-xl bg-emerald-500 hover:bg-emerald-600">
                    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                    Save to DB
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="h-9 rounded-xl text-slate-400 hover:text-white">
                    <X className="h-3.5 w-3.5 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
                    {localProfile?.full_name || user?.email?.split('@')[0] || "ACE Trainer"}
                  </h1>
                  {canEdit && (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="rounded-full p-2 text-slate-500 transition-colors hover:bg-white/5 hover:text-amber-400"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-slate-400">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-amber-400/60" />
                    <span className="text-sm font-medium text-slate-300">Trainer</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-amber-400/60" />
                    <span className="text-sm font-medium text-slate-300">{localProfile?.phone || "No phone added"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 md:items-end">
          <div className="w-[160px]">
            <div className="group relative aspect-square w-full overflow-hidden rounded-3xl border border-white/15 bg-white/5 shadow-2xl">
              {localProfile?.avatar_url ? (
                <img src={localProfile.avatar_url} alt="Profile" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-700">
                  <User className="h-16 w-16" />
                </div>
              )}
            </div>
            
            {canEdit && (
              <div className="mt-3 flex w-full gap-2">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                <Button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={uploading} 
                  className="h-8 flex-1 rounded-xl border border-white/10 bg-white/10 text-white backdrop-blur hover:bg-white/20"
                >
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                </Button>
                {localProfile?.avatar_url && (
                  <Button 
                    type="button" 
                    onClick={handleAvatarRemove} 
                    disabled={uploading} 
                    variant="outline" 
                    className="h-8 flex-1 rounded-xl border-red-500/20 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
