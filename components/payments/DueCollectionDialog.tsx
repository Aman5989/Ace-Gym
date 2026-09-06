"use client";

import { useState } from "react";
import { Check, Loader2, WalletCards } from "lucide-react";
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
import { formatCurrency, paymentMethods, toDateInputValue } from "@/lib/payment-utils";
import { Member } from "@/types/member";

interface Props {
  member: Member;
  compact?: boolean;
  onSuccess?: () => void;
}

export default function DueCollectionDialog({ member, compact = false, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(String(member.due_amount ?? 0));
  const [cashAmount, setCashAmount] = useState("");
  const [upiAmount, setUpiAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [paymentDate, setPaymentDate] = useState(toDateInputValue(new Date()));
  const [notes, setNotes] = useState("");

  const isMixed = paymentMethod === "UPI + Cash";
  const totalAmount = Number(amount || 0);

  function reset() {
    setAmount(String(member.due_amount ?? 0));
    setCashAmount("");
    setUpiAmount("");
    setPaymentMethod("UPI");
    setPaymentDate(toDateInputValue(new Date()));
    setNotes("");
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) reset();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericAmount = Number(amount);
    const numericCash = Number(cashAmount || 0);
    const numericUpi = Number(upiAmount || 0);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast.error("Enter a valid due amount");
      return;
    }
    if (numericAmount > Number(member.due_amount ?? 0)) {
      toast.error("Collection cannot exceed the member due amount");
      return;
    }
    if (isMixed && (numericCash <= 0 || numericUpi <= 0 || Math.abs(numericCash + numericUpi - numericAmount) > 0.01)) {
      toast.error("Cash and UPI amounts must add up to the due collection");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_id: member.id,
          amount: numericAmount,
          cash_amount: isMixed ? numericCash : paymentMethod === "Cash" ? numericAmount : 0,
          upi_amount: isMixed ? numericUpi : paymentMethod === "UPI" ? numericAmount : 0,
          payment_method: paymentMethod,
          fee_category: "due",
          payment_date: paymentDate,
          notes: notes || "Due collection",
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to collect due amount");

      toast.success(`Due collected from ${member.full_name}`, {
        description: `Remaining due: ${formatCurrency(result.remaining_due_amount)}`,
      });
      handleOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to collect due amount");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button type="button" size={compact ? "icon" : "default"} className={compact ? "h-9 w-9 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100" : "h-11 rounded-xl bg-amber-500 px-5 font-semibold text-white hover:bg-amber-600"} title="Collect due amount" aria-label="Collect due amount" />}>
        <Check className={compact ? "h-4 w-4" : "mr-2 h-4 w-4"} />
        {!compact && "Collect Due"}
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-1rem)] max-h-[calc(100dvh-1rem)] overflow-y-auto rounded-3xl border-slate-200 bg-white p-4 text-slate-900 shadow-2xl sm:max-w-lg sm:p-6">
        <DialogHeader className="pr-8">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-600"><WalletCards className="h-5 w-5" /></div>
          <DialogTitle className="text-xl font-bold sm:text-2xl">Collect due amount</DialogTitle>
          <DialogDescription className="text-slate-500">{member.full_name} · Outstanding due: {formatCurrency(member.due_amount)}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-3 space-y-4">
          <div className="space-y-2"><Label htmlFor="due-collection-amount">Collection amount</Label><div className="relative"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">₹</span><Input id="due-collection-amount" type="number" min="1" max={member.due_amount} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required autoFocus className="h-11 rounded-xl pl-8" /></div></div>
          <div className="space-y-2"><Label>Payment method</Label><Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value ?? "UPI")}><SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{paymentMethods.map((method) => <SelectItem key={method} value={method}>{method}</SelectItem>)}</SelectContent></Select></div>
          {isMixed ? <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3 sm:p-4"><p className="mb-3 text-sm font-semibold text-amber-950">Enter the actual split</p><div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="due-cash-amount">Cash amount</Label><Input id="due-cash-amount" type="number" min="0" step="0.01" value={cashAmount} onChange={(event) => setCashAmount(event.target.value)} required className="h-11 rounded-xl bg-white" /></div><div className="space-y-2"><Label htmlFor="due-upi-amount">UPI amount</Label><Input id="due-upi-amount" type="number" min="0" step="0.01" value={upiAmount} onChange={(event) => setUpiAmount(event.target.value)} required className="h-11 rounded-xl bg-white" /></div></div><p className="mt-3 text-sm font-bold text-amber-950">Total collection: {formatCurrency(totalAmount)}</p></div> : null}
          <div className="space-y-2"><Label htmlFor="due-payment-date">Collection date</Label><Input id="due-payment-date" type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} required className="h-11 rounded-xl" /></div>
          <div className="space-y-2"><Label htmlFor="due-payment-notes">Notes <span className="font-normal text-slate-400">(optional)</span></Label><Textarea id="due-payment-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Receipt number or note" className="min-h-20 resize-none rounded-xl" /></div>
          <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl bg-slate-950 text-white hover:bg-slate-800">{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving collection…</> : <><Check className="mr-2 h-4 w-4" /> Save {formatCurrency(totalAmount)} collection</>}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
