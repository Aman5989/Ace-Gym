"use client";

import { useState } from "react";
import { Download, Loader2, Printer, ReceiptText } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  downloadMemberPdf,
  downloadRenewalPdf,
  printMemberPdf,
  printRenewalPdf,
  RenewalPdfData,
} from "@/lib/member-pdf";
import { Member } from "@/types/member";

interface Props {
  member: Member;
  renewal?: RenewalPdfData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PdfOptionsDialog({ member, renewal, open, onOpenChange }: Props) {
  const [loading, setLoading] = useState<"download" | "print" | null>(null);
  const isRenewal = Boolean(renewal);

  async function handleDownload() {
    setLoading("download");
    try {
      if (renewal) {
        await downloadRenewalPdf(member, renewal);
      } else {
        await downloadMemberPdf(member);
      }
      toast.success(`${isRenewal ? "Renewal" : "Member"} PDF downloaded`);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create PDF");
    } finally {
      setLoading(null);
    }
  }

  async function handlePrint() {
    setLoading("print");
    try {
      if (renewal) {
        await printRenewalPdf(member, renewal);
      } else {
        await printMemberPdf(member);
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to print PDF");
    } finally {
      setLoading(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1rem)] rounded-3xl border-slate-200 bg-white p-5 text-slate-900 shadow-2xl sm:max-w-md sm:p-6">
        <DialogHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <ReceiptText className="h-5 w-5" />
          </div>
          <DialogTitle className="text-xl font-bold sm:text-2xl">
            {isRenewal ? "Renewal completed" : "Member PDF"}
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            {isRenewal
              ? `${member.full_name}'s renewal receipt is ready.`
              : `Choose how to use ${member.full_name}'s membership form.`}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            onClick={handleDownload}
            disabled={loading !== null}
            className="h-12 rounded-xl bg-slate-950 font-semibold text-white hover:bg-slate-800"
          >
            {loading === "download" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Download PDF
          </Button>
          <Button
            type="button"
            onClick={handlePrint}
            disabled={loading !== null}
            variant="outline"
            className="h-12 rounded-xl border-slate-300 font-semibold text-slate-800 hover:bg-slate-50"
          >
            {loading === "print" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
            Print
          </Button>
        </div>

        {isRenewal ? (
          <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900">
            <p className="font-semibold">{renewal?.membershipPlan} plan renewed</p>
            <p className="mt-1 text-emerald-700">New due date: {new Date(`${renewal?.nextDueDate}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
