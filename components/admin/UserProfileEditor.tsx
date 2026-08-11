"use client";

import { useState, useRef } from "react";
import { User, Phone, Upload, Loader2, Camera, Check, X, Trash2 } from "lucide-react";
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
      if (!response.ok) throw new Error(result.error || "Failed to update profile");
      
      toast.success(`Profile for ${email} updated`);
      router.refresh();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
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
      toast.success("Photo uploaded. Save to apply changes.");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload photo");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-3xl bg-slate-900 border-white/10 text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit Trainer Profile</DialogTitle>
          <p className="text-sm text-slate-400">{email}</p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-32 w-32 overflow-hidden rounded-3xl border-2 border-white/10 bg-white/5 shadow-xl">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-600">
                  <User className="h-16 w-16" />
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
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
                className="h-8 rounded-lg border-white/10 bg-white/5 text-xs hover:bg-white/10"
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Upload
              </Button>
              {avatarUrl && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setAvatarUrl(null)} 
                  disabled={uploading}
                  className="h-8 rounded-lg border-red-500/20 bg-red-500/10 text-xs text-red-300 hover:bg-red-500/20"
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Remove
                </Button>
              )}
            </div>
          </div>

          {/* Form Section */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Full Name</label>
              <Input 
                value={formData.full_name} 
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                className="h-11 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-slate-600 focus:border-amber-400/50"
                placeholder="Trainer's display name"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Phone Number</label>
              <Input 
                value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="h-11 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-slate-600 focus:border-amber-400/50"
                placeholder="Contact number"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              onClick={handleUpdateProfile} 
              disabled={loading || uploading}
              className="flex-1 h-11 rounded-xl bg-amber-400 font-bold text-slate-950 hover:bg-amber-300"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
            <Button 
              variant="ghost" 
              onClick={onClose}
              className="h-11 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
