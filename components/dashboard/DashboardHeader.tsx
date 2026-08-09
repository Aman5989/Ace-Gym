"use client";


import { Button } from "@/components/ui/button";

import { Plus, LogOut, Flame, Upload, Image as ImageIcon, Loader2, Trash2 } from "lucide-react";

import { useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";


import MemberForm from "@/components/forms/MemberForm";
import MonthCloseButton from "@/components/dashboard/MonthCloseButton";

import { createClient } from "@/lib/supabase";


import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";



export default function DashboardHeader({ canCloseMonth = false, paymentCount = 0, total = 0, heroImageUrl = null }: { canCloseMonth?: boolean; paymentCount?: number; total?: number; heroImageUrl?: string | null }) {


  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(heroImageUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const router = useRouter();




  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append("image", file);
      const response = await fetch("/api/dashboard-image", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to upload image");
      setImageUrl(result.url);
      toast.success("Dashboard image updated");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to upload image");
    } finally {
      setUploading(false);
    }
  }

  async function handleImageRemove() {
    if (!imageUrl) return;
    setUploading(true);
    try {
      const response = await fetch("/api/dashboard-image", { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to remove image");
      setImageUrl(null);
      toast.success("Dashboard image removed");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to remove image");
    } finally {
      setUploading(false);
    }
  }

  async function handleLogout() {


    const supabase = createClient();



    const {
      error
    } = await supabase.auth.signOut();




    if (error) {


      console.log(
        "LOGOUT ERROR:",
        error
      );


      toast.error(
        "Logout failed"
      );


      return;

    }




    toast.success(
      "Logged out successfully"
    );



    router.push("/login");

    router.refresh();


  }




  return (

    <>

      <div
        className="
          ace-glass ace-shimmer ace-reveal ace-shell
          relative
          overflow-hidden
          rounded-3xl
          border
          border-white/10
          bg-gradient-to-br
          from-[#0a0e27]
          via-[#111740]
          to-[#1a0d33]
          p-8
          shadow-2xl
          shadow-indigo-950/40
          md:p-10
        "
      >

        {/* Decorative glow accents */}
        <div
          aria-hidden
          className="
            pointer-events-none
            absolute
            -top-24
            -right-24
            h-72
            w-72
            rounded-full
            bg-amber-400/20
            blur-3xl
          "
        />

        <div
          aria-hidden
          className="
            pointer-events-none
            absolute
            -bottom-32
            -left-20
            h-80
            w-80
            rounded-full
            bg-violet-500/20
            blur-3xl
          "
        />

        <div
          aria-hidden
          className="
            pointer-events-none
            absolute
            inset-0
            bg-[radial-gradient(circle_at_70%_20%,rgba(251,191,36,0.08),transparent_50%)]
          "
        />


        <div
          className="
            relative
            flex
            flex-col
            gap-6
            md:flex-row
            md:items-center
            md:justify-between
          "
        >


          {/* Brand block */}
          <div>


            <div
              className="
                flex
                items-center
                gap-2
                mb-3
              "
            >

              <img
                src="/acegym-icon.png"
                alt="ACE々GYM logo"
                className="
                  ace-float
                  h-10
                  w-auto
                  drop-shadow-[0_2px_6px_rgba(251,191,36,0.45)]
                "
              />


              <span
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-[0.25em]
                  text-amber-400/90
                "
              >
                Admin Dashboard
              </span>


            </div>


            <h1
              className="
                ace-reveal ace-reveal-1
                text-4xl
                font-black
                tracking-tight
                text-white
                md:text-5xl
              "
            >
              ACE<span className="text-amber-400">々</span>GYM
            </h1>




            <p
              className="
                mt-2
                text-sm
                text-slate-400
                md:text-base
              "
            >
              Manage members, subscriptions and monthly dues.
            </p>


          </div>




          {/* Admin image upload */}
          <div className="flex w-full flex-1 flex-col items-stretch gap-2 md:min-w-[420px] md:items-end">
            {canCloseMonth ? (
              <div className="flex w-full justify-end">
                <div className="w-[220px] max-w-full">
                  {imageUrl ? (
                    <img src={imageUrl} alt="Dashboard gym visual" className="aspect-square w-full rounded-2xl border border-white/15 object-cover shadow-xl shadow-black/20" />
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 text-slate-500">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <div className="mt-2 flex w-full gap-2">
                    <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="h-7 min-w-0 flex-1 rounded-lg border border-white/15 bg-white/10 px-2 text-[10px] font-semibold text-white backdrop-blur hover:bg-white/15">
                      {uploading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Upload className="mr-1 h-3 w-3" />}
                      {uploading ? "Uploading…" : "Update image"}
                    </Button>
                    {imageUrl ? (
                      <Button type="button" onClick={handleImageRemove} disabled={uploading} variant="outline" className="h-7 min-w-0 flex-1 rounded-lg border-red-400/25 bg-red-500/10 px-2 text-[10px] font-semibold text-red-200 hover:bg-red-500/20 hover:text-red-100">
                        <Trash2 className="mr-1 h-3 w-3" />
                        Remove image
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
        {/* Stat strip */}
        <div
          className="
            relative
            mt-8
            flex
            flex-wrap
            items-center
            gap-x-8
            gap-y-2
            border-t
            border-white/10
            pt-5
          "
        >

          <div className="flex items-center gap-2">

            <Flame className="h-4 w-4 text-amber-400" />

            <span className="text-xs font-medium text-slate-400">
              Powering your gym since day one
            </span>

          </div>


        </div>


        <div className="relative mt-4 flex flex-wrap items-center justify-end gap-3">
          {canCloseMonth ? <MonthCloseButton paymentCount={paymentCount} total={total} /> : null}
          <Button onClick={() => setOpen(true)} className="ace-focus-ring h-11 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 font-semibold text-slate-950 shadow-lg shadow-amber-500/30 transition-all hover:from-amber-300 hover:to-orange-400 hover:shadow-amber-500/50">
            <Plus className="mr-2 h-5 w-5" />
            Add Member
          </Button>
          <Button onClick={handleLogout} variant="destructive" className="ace-focus-ring h-11 rounded-xl border border-red-500/30 bg-red-500/10 px-6 font-medium text-red-300 backdrop-blur transition-all hover:bg-red-500/20">
            <LogOut className="mr-2 h-5 w-5" />
            Logout
          </Button>
        </div>
      </div>
      <Dialog
        open={open}
        onOpenChange={setOpen}
      >


        <DialogContent

          className="
            max-w-xl
            max-h-[90vh]
            overflow-y-auto
            rounded-3xl
            bg-white
            text-slate-900
            border
            border-slate-200
            shadow-2xl
          "

        >


          <DialogHeader>


            <DialogTitle

              className="
                text-2xl
                font-bold
                text-slate-900
              "

            >

              Add New Member

            </DialogTitle>


          </DialogHeader>




          <div
            className="
              mt-2
            "
          >

            <MemberForm
              onSuccess={() => setOpen(false)}
            />

          </div>


        </DialogContent>


      </Dialog>



    </>

  );

}
