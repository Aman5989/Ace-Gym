"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Clock3, History, Loader2, ReceiptText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/payment-utils";
import { Member } from "@/types/member";
import { Payment } from "@/types/payment";

interface Props {
  member: Member;
  compact?: boolean;
}

export default function PaymentHistory({ member, compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(value: boolean) {
    if (value) {
      setLoading(true);
      setError(null);
    }
    setOpen(value);
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    fetch(`/api/payments?member_id=${encodeURIComponent(member.id)}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Unable to load payment history");
        if (!cancelled) setPayments(result.payments ?? []);
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Unable to load payment history");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [member.id, open]);

  const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size={compact ? "icon" : "default"}
            className={compact ? "h-9 w-9 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900" : "h-10 rounded-xl text-slate-700 hover:bg-slate-100"}
            title="Payment history"
          />
        }
      >
        <History className={compact ? "h-4 w-4" : "mr-2 h-4 w-4"} />
        {!compact && "Payment history"}
      </DialogTrigger>

      <DialogContent className="max-w-xl rounded-3xl border-slate-200 bg-white text-slate-900 shadow-2xl">
        <DialogHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-600"><ReceiptText className="h-5 w-5" /></div>
          <DialogTitle className="text-2xl font-bold">Payment history</DialogTitle>
          <DialogDescription className="text-slate-500">{member.full_name} · {payments.length} recorded payment{payments.length === 1 ? "" : "s"}</DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex items-center justify-between rounded-2xl bg-slate-950 px-4 py-3 text-white">
          <span className="text-sm text-slate-300">Total recorded</span>
          <span className="text-xl font-bold">{formatCurrency(totalPaid)}</span>
        </div>

        <div className="mt-1 max-h-[52vh] space-y-2 overflow-y-auto pr-1">
          {loading && <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading history…</div>}
          {error && <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
          {!loading && !error && payments.length === 0 && <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">No payments recorded yet.</div>}
          {!loading && !error && payments.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{formatCurrency(Number(payment.amount))}</p>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{new Date(`${payment.payment_date}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                  <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{payment.payment_method}</span>
                </div>
                {payment.notes && <p className="mt-1 truncate text-xs text-slate-400">{payment.notes}</p>}
              </div>
              <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Paid</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
