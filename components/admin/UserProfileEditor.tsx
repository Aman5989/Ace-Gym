"use client";

import { useState, useRef } from "react";
import { User, Phone, Upload, Loader2, Camera, Check, X, Trash2, Fingerprint, ShieldCheck, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  userId: string;
  email: string;
  initialProfile: UserProfile | null;
  onClose: () => void;
}

export default function UserProfileEditor({ userId, email, initialProfile, onClose }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: initialProfile?.full_name ?? "",
    phone: initialProfile?.phone ?? "",
  });

  const [avatarUrl, setAvatarUrl] = useState(initialProfile?.avatar_url);

  async function handleUpdateProfile() {
    setLoading(true);
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          full_name: formData.full_name,
          phone: formData.phone,
          avatar_url: avatarUrl,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to save");
      
      const saved = result.saved;
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-bold text-emerald-400">Database Verified!</span>
          <span className="text-[10px] text-slate-300">Name: {saved.full_name}</span>
          <span className="text-[10px] text-slate-300">Phone: {saved.phone || 'None'}</span>
        </div>
      );
      
      router.refresh();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      toast.success("Photo uploaded successfully");
    } catch (error: any) {
      toast.error("Upload failed: " + error.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-[2rem] bg-slate-900 border-white/10 text-white shadow-2xl p-6 md:p-8">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-400 mb-2">
            <Database className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Verified DB Write</span>
          </div>
          <DialogTitle className="text-2xl font-black tracking-tight">Edit Trainer Profile</DialogTitle>
          <div className="flex flex-col gap-1.5 mt-2">
            <p className="text-sm text-slate-400 font-medium">{email}</p>
            <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-400 bg-cyan-400/10 w-fit px-2.5 py-1.5 rounded-lg border border-cyan-400/20">
              <Fingerprint className="h-3 w-3" />
              TARGET ID: {userId}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-8 py-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-36 w-36 overflow-hidden rounded-[2rem] border-2 border-white/10 bg-white/5 shadow-2xl">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-700">
                  <User className="h-16 w-16" />
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()} 
                disabled={uploading}
                className="h-9 rounded-xl border-white/10 bg-white/5 px-4 text-xs hover:bg-white/10"
              >
                <Upload className="mr-2 h-3.5 w-3.5" />
                Upload Photo
              </Button>
              {avatarUrl && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setAvatarUrl(null)} 
                  disabled={uploading}
                  className="h-9 rounded-xl border-red-500/20 bg-red-500/10 px-4 text-xs text-red-200 hover:bg-red-500/20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Full Name</label>
              <Input 
                value={formData.full_name} 
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-slate-600 focus:border-amber-400/50 focus:ring-amber-400/10"
                placeholder="Enter display name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Phone Number</label>
              <Input 
                value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-slate-600 focus:border-amber-400/50 focus:ring-amber-400/10"
                placeholder="Enter contact number"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleUpdateProfile} 
              disabled={loading || uploading}
              className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 font-bold text-slate-950 hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-400/10"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Verified Save
            </Button>
            <Button 
              variant="ghost" 
              onClick={onClose}
              className="h-12 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 px-6"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
