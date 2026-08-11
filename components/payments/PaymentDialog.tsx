"use client";

import { useMemo, useState } from "react";
import { CalendarCheck, Check, CreditCard, Loader2, WalletCards } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { advanceDueDate, formatCurrency, paymentMethods, toDateInputValue } from "@/lib/payment-utils";
import { Member } from "@/types/member";

interface Props {
  member: Member;
  onSuccess?: () => void;
  compact?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}

export default function PaymentDialog({ member, onSuccess, compact = false, open, onOpenChange, showTrigger = true }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const dialogOpen = open ?? internalOpen;
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(String(member.monthly_fee ?? ""));
  const [cashAmount, setCashAmount] = useState("");
  const [upiAmount, setUpiAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [paymentDate, setPaymentDate] = useState(toDateInputValue(new Date()));
  const [notes, setNotes] = useState("");

  const isMixed = paymentMethod === "UPI + Cash";
  const totalAmount = isMixed ? Number(cashAmount || 0) + Number(upiAmount || 0) : Number(amount || 0);
  const nextDueDate = useMemo(
    () => advanceDueDate(member.next_due_date, member.membership_plan, paymentDate),
    [member.membership_plan, member.next_due_date, paymentDate],
  );

  function handleOpenChange(nextOpen: boolean) {
    if (!isControlled) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
    if (!nextOpen) reset();
  }

  function reset() {
    setAmount(String(member.monthly_fee ?? ""));
    setCashAmount("");
    setUpiAmount("");
    setPaymentMethod("UPI");
    setPaymentDate(toDateInputValue(new Date()));
    setNotes("");
  }

  function handleMethodChange(value: string | null) {
    const nextMethod = value ?? "UPI";
    setPaymentMethod(nextMethod);
    if (nextMethod === "UPI + Cash" && !cashAmount && !upiAmount) {
      setCashAmount("");
      setUpiAmount("");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isMixed && (Number(cashAmount || 0) <= 0 || Number(upiAmount || 0) <= 0)) {
      toast.error("Enter both Cash and UPI amounts for a mixed payment");
      return;
    }
    if (totalAmount <= 0) {
      toast.error("Enter a valid payment amount");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_id: member.id,
          amount: totalAmount,
          cash_amount: isMixed ? Number(cashAmount) : paymentMethod === "Cash" ? totalAmount : 0,
          upi_amount: isMixed ? Number(upiAmount) : paymentMethod === "UPI" ? totalAmount : 0,
          payment_method: paymentMethod,
          fee_category: "renewal",
          payment_date: paymentDate,
          notes: notes || "Renewal fee",
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to record payment");
      toast.success(`Payment recorded for ${member.full_name}`, {
        description: `Next due date: ${new Date(`${result.next_due_date}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`,
      });
      handleOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to record payment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {showTrigger ? (
        <DialogTrigger render={<Button type="button" size={compact ? "icon" : "default"} className={compact ? "h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "h-11 rounded-xl bg-emerald-500 px-5 font-semibold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600"} title="Record payment" />}>
          <Check className={compact ? "h-4 w-4" : "mr-2 h-4 w-4"} />
          {!compact && "Record Payment"}
        </DialogTrigger>
      ) : null}
      <DialogContent className="w-[calc(100%-1rem)] max-h-[calc(100dvh-1rem)] overflow-y-auto overscroll-contain rounded-3xl border-slate-200 bg-white p-4 text-slate-900 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:max-w-lg sm:p-6">
        <DialogHeader className="pr-8">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 sm:h-11 sm:w-11"><WalletCards className="h-5 w-5" /></div>
          <DialogTitle className="text-xl font-bold sm:text-2xl">Record renewal fee</DialogTitle>
          <DialogDescription className="text-slate-500">{member.full_name} · {member.membership_plan} plan</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-3 space-y-4 sm:space-y-5">
          <div className="space-y-2">
            <Label>Payment method</Label>
            <Select value={paymentMethod} onValueChange={handleMethodChange}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>{paymentMethods.map((method) => <SelectItem key={method} value={method}>{method}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {isMixed ? (
            <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-3 sm:p-4">
              <p className="mb-3 text-sm font-semibold text-violet-950">Enter the actual split</p>
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                <div className="space-y-2"><Label htmlFor="cash-amount">Cash amount</Label><div className="relative"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">₹</span><Input id="cash-amount" type="number" min="0" step="0.01" value={cashAmount} onChange={(event) => setCashAmount(event.target.value)} required className="h-11 rounded-xl bg-white pl-8" /></div></div>
                <div className="space-y-2"><Label htmlFor="upi-amount">UPI amount</Label><div className="relative"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">₹</span><Input id="upi-amount" type="number" min="0" step="0.01" value={upiAmount} onChange={(event) => setUpiAmount(event.target.value)} required className="h-11 rounded-xl bg-white pl-8" /></div></div>
              </div>
              <p className="mt-3 text-sm font-bold text-violet-950">Total payment: {formatCurrency(totalAmount)}</p>
            </div>
          ) : (
            <div className="space-y-2"><Label htmlFor="payment-amount">Amount</Label><div className="relative"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">₹</span><Input id="payment-amount" type="number" min="1" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required autoFocus className="h-11 rounded-xl pl-8" /></div></div>
          )}
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            <div className="space-y-2"><Label htmlFor="payment-date">Payment date</Label><Input id="payment-date" type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} required className="h-11 rounded-xl" /></div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-700"><CalendarCheck className="h-4 w-4" /> Next due date</div><p className="mt-1 text-lg font-bold text-emerald-950">{new Date(`${nextDueDate}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p><p className="text-xs text-emerald-700">Automatically advanced from the current due date.</p></div>
          </div>
          <div className="space-y-2"><Label htmlFor="payment-notes">Notes <span className="font-normal text-slate-400">(optional)</span></Label><Textarea id="payment-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Receipt number, reference, or note" className="min-h-20 resize-none rounded-xl" /></div>
          <Button type="submit" disabled={loading} className="sticky bottom-0 h-12 w-full rounded-xl bg-slate-950 text-white shadow-lg shadow-white/70 hover:bg-slate-800">{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving payment…</> : <><CreditCard className="mr-2 h-4 w-4" /> Save {formatCurrency(totalAmount)} payment</>}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
