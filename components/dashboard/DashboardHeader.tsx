"use client";


import { Button } from "@/components/ui/button";

import { Plus, LogOut, Flame, Upload, Image as ImageIcon, Loader2, Trash2, RefreshCw, Search } from "lucide-react";

import { useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";


import MemberForm from "@/components/forms/MemberForm";
import MonthCloseButton from "@/components/dashboard/MonthCloseButton";
import PaymentDialog from "@/components/payments/PaymentDialog";
import PdfOptionsDialog from "@/components/payments/PdfOptionsDialog";
import { RenewalPdfData } from "@/lib/member-pdf";
import { Member } from "@/types/member";

import { createClient } from "@/lib/supabase";


import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";



export default function DashboardHeader({ canCloseMonth = false, canRecordPayments = false, paymentCount = 0, total = 0, heroImageUrl = null, members = [], isTrainer = false }: { canCloseMonth?: boolean; canRecordPayments?: boolean; paymentCount?: number; total?: number; heroImageUrl?: string | null; members?: Member[]; isTrainer?: boolean }) {


  const [open, setOpen] = useState(false);
  const [newMemberPdf, setNewMemberPdf] = useState<Member | null>(null);
  const [renewalOpen, setRenewalOpen] = useState(false);
  const [renewalSearch, setRenewalSearch] = useState("");
  const [renewalMember, setRenewalMember] = useState<Member | null>(null);
  const [renewalPaymentOpen, setRenewalPaymentOpen] = useState(false);
  const [renewalReceipt, setRenewalReceipt] = useState<{ member: Member; renewal: RenewalPdfData } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(heroImageUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const router = useRouter();
  const matchingRenewalMembers = members.filter((member) => {
    const query = renewalSearch.trim().toLowerCase();
    if (!query) return false;
    return member.full_name.toLowerCase().includes(query) || member.phone.toLowerCase().includes(query);
  }).slice(0, 8);

  function openRenewalDialog() {
    setRenewalSearch("");
    setRenewalOpen(true);
  }

  function selectRenewalMember(member: Member) {
    setRenewalMember(member);
    setRenewalOpen(false);
    setRenewalPaymentOpen(true);
  }


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
          className={`
            ace-glass ace-shimmer ace-reveal ace-shell
            relative
            overflow-hidden
            rounded-3xl
            border
            border-white/10
            ${isTrainer ? "bg-[#0b1017]" : "bg-gradient-to-br from-[#0a0e27] via-[#111740] to-[#1a0d33]"}
            p-8
            shadow-2xl
            shadow-indigo-950/40
            md:p-10
          `}
        >
          {isTrainer ? (
            <>
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/assets/trainer-dashboard-bg.png')" }}
              />
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/60 to-slate-950/15" />
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-slate-950/10" />
            </>
          ) : null}

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
          <div className="flex w-full flex-1 flex-col items-stretch gap-2 md:min-w-[360px] md:items-end">
            {canCloseMonth ? (
              <div className="flex w-full justify-end">
                <div className="w-[160px] max-w-full">
                  {imageUrl ? (
                    <img src={imageUrl} alt="Dashboard gym visual" className="aspect-square w-full rounded-2xl border border-white/15 object-cover shadow-xl shadow-black/20" />
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 text-slate-500">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <div className="mt-2 flex w-full gap-2">
                    <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} aria-label={uploading ? "Uploading dashboard image" : "Update dashboard image"} title={uploading ? "Uploading dashboard image" : "Update dashboard image"} className="h-6 min-w-0 flex-1 rounded-md border border-white/15 bg-white/10 px-1.5 text-white backdrop-blur hover:bg-white/15">
                      {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                    </Button>
                    {imageUrl ? (
                      <Button type="button" onClick={handleImageRemove} disabled={uploading} variant="outline" aria-label="Remove dashboard image" title="Remove dashboard image" className="h-6 min-w-0 flex-1 rounded-md border-red-400/25 bg-red-500/10 px-1.5 text-red-200 hover:bg-red-500/20 hover:text-red-100">
                        <Trash2 className="h-3 w-3" />
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
          {canRecordPayments ? (
            <Button onClick={openRenewalDialog} className="ace-focus-ring h-11 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 px-6 font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-300 hover:to-teal-400">
              <RefreshCw className="mr-2 h-5 w-5" />
              Renewal
            </Button>
          ) : null}
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
              onSuccess={(createdMember) => {
                setOpen(false);
                if (createdMember) setNewMemberPdf(createdMember);
              }}
            />

          </div>


        </DialogContent>


      </Dialog>

      <Dialog open={renewalOpen} onOpenChange={setRenewalOpen}>
        <DialogContent className="w-[calc(100%-1rem)] max-h-[calc(100dvh-1rem)] overflow-y-auto rounded-3xl border-slate-200 bg-white p-4 text-slate-900 shadow-2xl sm:max-w-lg sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900">Find member for renewal</DialogTitle>
          </DialogHeader>
          <div className="mt-3 space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                value={renewalSearch}
                onChange={(event) => setRenewalSearch(event.target.value)}
                placeholder="Search by member name or phone"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div className="space-y-2">
              {!renewalSearch.trim() ? (
                <p className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">Start typing to search existing members.</p>
              ) : matchingRenewalMembers.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">No matching member found.</p>
              ) : (
                matchingRenewalMembers.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => selectRenewalMember(member)}
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    <span>
                      <span className="block font-semibold text-slate-900">{member.full_name}</span>
                      <span className="mt-1 block text-xs text-slate-500">{member.phone} · {member.membership_plan}</span>
                    </span>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Renew</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {newMemberPdf ? (
        <PdfOptionsDialog
          member={newMemberPdf}
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setNewMemberPdf(null);
          }}
        />
      ) : null}

      {renewalMember ? (
        <PaymentDialog
          key={renewalMember.id}
          member={renewalMember}
          open={renewalPaymentOpen}
          showTrigger={false}
          onOpenChange={(nextOpen) => {
            setRenewalPaymentOpen(nextOpen);
            if (!nextOpen) setRenewalMember(null);
          }}
          onSuccess={(receipt) => {
            if (renewalMember) {
              setRenewalReceipt({
                member: {
                  ...renewalMember,
                  membership_plan: receipt.membershipPlan,
                  next_due_date: receipt.nextDueDate,
                },
                renewal: receipt,
              });
            }
            setRenewalPaymentOpen(false);
            setRenewalMember(null);
            router.refresh();
          }}
        />
      ) : null}

      {renewalReceipt ? (
        <PdfOptionsDialog
          member={renewalReceipt.member}
          renewal={renewalReceipt.renewal}
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setRenewalReceipt(null);
          }}
        />
      ) : null}


    </>

  );

}
