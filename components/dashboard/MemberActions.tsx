"use client";

import { useState } from "react";
import { Download, MessageCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Member } from "@/types/member";
import EditMemberDialog from "./EditMemberDialog";
import PaymentDialog from "@/components/payments/PaymentDialog";
import PaymentHistory from "@/components/payments/PaymentHistory";
import { downloadMemberPdf } from "@/lib/member-pdf";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Props { member: Member; canViewPayments?: boolean; canEdit?: boolean; canDelete?: boolean; }

function whatsappNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
}

export default function MemberActions({ member, canViewPayments = true, canEdit = true, canDelete = true }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  function downloadProfile() {
    try {
      downloadMemberPdf(member);
      toast.success("Member PDF downloaded");
    } catch (error) {
      console.error("MEMBER PDF ERROR:", error);
      toast.error("Unable to create member PDF");
    }
  }

  function sendReminder() {
    if (!member.phone) {
      toast.error("This member does not have a phone number");
      return;
    }
    const dueDate = new Date(`${member.next_due_date}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    const message = `Hi ${member.full_name}, this is a reminder from ACE々GYM. Your membership payment is due on ${dueDate}. Please reply to confirm your payment. Thank you!`;
    window.open(`https://wa.me/${whatsappNumber(member.phone)}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  async function deleteMember() {
    setDeleting(true);
    try {
      const response = await fetch(`/api/members/${member.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to delete member");
      toast.success("Member deleted");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete member");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      {canViewPayments ? <PaymentDialog member={member} compact onSuccess={() => router.refresh()} /> : null}
      {canViewPayments ? <PaymentHistory member={member} compact /> : null}
      <Button type="button" variant="ghost" size="icon" onClick={downloadProfile} title="Download member PDF" className="h-9 w-9 rounded-xl text-indigo-500 hover:bg-indigo-50 hover:text-indigo-600">
        <Download className="h-4 w-4" />
      </Button>
      {canViewPayments ? (
        <Button type="button" variant="ghost" size="icon" onClick={sendReminder} title="Send WhatsApp reminder" className="h-9 w-9 rounded-xl text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600">
          <MessageCircle className="h-4 w-4" />
        </Button>
      ) : null}
      {canEdit ? <EditMemberDialog member={member} /> : null}
      {canDelete ? (
        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600" title="Delete member" />}>
            <Trash2 className="h-4 w-4" />
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-2xl border-slate-200 bg-white text-slate-900">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold">Delete member?</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-500">This permanently removes <span className="font-semibold text-slate-900">{member.full_name}</span> and their payment history.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction disabled={deleting} onClick={deleteMember} className="rounded-xl bg-red-600 text-white hover:bg-red-700">{deleting ? "Deleting…" : "Delete"}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </div>
  );
}
