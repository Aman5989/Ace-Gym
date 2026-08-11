"use client";

import { useState, useRef } from "react";
import { User, Phone, Upload, Loader2, Camera, Check, X, Edit2 } from "lucide-react";
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
  
  const [formData, setFormData] = useState({
    full_name: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
  });

  const canEdit = role === "admin";

  async function handleUpdateProfile() {
    if (!canEdit) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          full_name: formData.full_name,
          phone: formData.phone,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      
      toast.success("Profile updated successfully");
      setIsEditing(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
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
      const filePath = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        });

      if (updateError) throw updateError;

      toast.success("Avatar updated successfully");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="ace-glass ace-reveal relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0a0e27] via-[#111740] to-[#1a0d33] p-6 shadow-2xl md:p-8">
      {/* Decorative accents */}
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative flex flex-col items-center justify-between gap-6 md:flex-row">
        {/* Left Side: Brand & Details */}
        <div className="flex-1 space-y-4">
          <div className="space-y-1">
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-amber-400/80">
              ACE<span className="text-white">々</span>Trainer
            </h2>
            {isEditing ? (
              <div className="mt-4 space-y-3 max-w-xs">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Full Name</label>
                  <Input 
                    value={formData.full_name} 
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="h-9 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-slate-600 focus:border-amber-400/50 focus:ring-amber-400/20"
                    placeholder="Trainer Name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Phone Number</label>
                  <Input 
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="h-9 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-slate-600 focus:border-amber-400/50 focus:ring-amber-400/20"
                    placeholder="Phone Number"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button 
                    size="sm" 
                    onClick={handleUpdateProfile} 
                    disabled={loading}
                    className="h-8 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600"
                  >
                    {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
                    Save
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setIsEditing(false)}
                    className="h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
                    {profile?.full_name || user?.email?.split('@')[0] || "ACE Trainer"}
                  </h1>
                  {canEdit && (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-white/5 hover:text-amber-400"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-slate-400">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-amber-400/60" />
                    <span className="text-sm font-medium">{role === 'admin' ? 'Administrator' : 'Gym Trainer'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-amber-400/60" />
                    <span className="text-sm font-medium">{profile?.phone || "No phone added"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Photo */}
        <div className="relative shrink-0">
          <div className="group relative h-32 w-32 overflow-hidden rounded-3xl border-2 border-white/10 bg-white/5 shadow-2xl md:h-40 md:w-40">
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt="Profile" 
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-600">
                <User className="h-16 w-16" />
              </div>
            )}
            
            {canEdit && (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              >
                {uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                ) : (
                  <>
                    <Camera className="mb-1 h-6 w-6 text-white" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white">Change Photo</span>
                  </>
                )}
              </div>
            )}
          </div>
          
          {canEdit && (
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              onChange={handleAvatarUpload} 
              className="hidden" 
            />
          )}
          
          {/* Status Badge */}
          <div className="absolute -bottom-2 -right-2 rounded-xl bg-emerald-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-500/40">
            Online
          </div>
        </div>
      </div>
    </div>
  );
}
