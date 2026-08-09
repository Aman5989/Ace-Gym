"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, History, Loader2, ReceiptText, RefreshCw, WalletCards } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PaymentWithMember } from "@/types/payment";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}
function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminPaymentLedger() {
  const [payments, setPayments] = useState<PaymentWithMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadPayments() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/payments?all=true", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to load transaction history");
      setPayments(result.payments ?? []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load transaction history");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadPayments(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const totals = useMemo(() => ({
    total: payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    cash: payments.filter((payment) => payment.payment_method.toLowerCase() === "cash").reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    upi: payments.filter((payment) => payment.payment_method.toLowerCase() === "upi").reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
  }), [payments]);

  return (
    <Card className="ace-glass overflow-hidden rounded-3xl border-white/10 text-white">
      <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="mb-2 flex items-center gap-2 text-violet-300"><History className="h-4 w-4" /><span className="text-xs font-semibold uppercase tracking-[0.2em]">Financial archive</span></div>
          <CardTitle className="text-xl font-bold">All payment transactions</CardTitle>
          <p className="mt-1 text-sm text-slate-400">Complete history across active and closed collection periods. No payment records are removed when a month is closed.</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => void loadPayments()} disabled={loading} className="shrink-0 rounded-xl border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white" title="Refresh transaction history"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid gap-px border-b border-white/10 bg-white/10 sm:grid-cols-3">
          {[{ label: "All-time collected", value: totals.total, icon: WalletCards }, { label: "Cash collected", value: totals.cash, icon: ReceiptText }, { label: "UPI collected", value: totals.upi, icon: ReceiptText }].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-slate-950/40 px-5 py-4"><div className="flex items-center gap-2 text-xs text-slate-400"><Icon className="h-3.5 w-3.5" />{label}</div><p className="mt-1 text-lg font-bold text-white">{formatCurrency(value)}</p></div>
          ))}
        </div>
        {loading && <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading complete transaction history…</div>}
        {error && <div className="m-5 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>}
        {!loading && !error && payments.length === 0 && <div className="p-10 text-center text-sm text-slate-400">No payment transactions have been recorded yet.</div>}
        {!loading && !error && payments.length > 0 && <div className="max-h-[560px] overflow-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="sticky top-0 z-10 bg-[#101633] text-xs uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-3">Date</th><th className="px-5 py-3">Member</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3">Method</th><th className="px-5 py-3">Collection period</th><th className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y divide-white/5">{payments.map((payment) => { const periodClosed = payment.collection_period?.status === "closed"; return <tr key={payment.id} className="transition-colors hover:bg-white/[0.04]"><td className="whitespace-nowrap px-5 py-4 text-slate-300"><span className="inline-flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5 text-violet-300" />{formatDate(payment.payment_date)}</span></td><td className="px-5 py-4"><p className="font-semibold text-white">{payment.member?.full_name ?? "Unknown member"}</p>{payment.notes && <p className="mt-1 max-w-[220px] truncate text-xs text-slate-500">{payment.notes}</p>}</td><td className="whitespace-nowrap px-5 py-4 font-bold text-emerald-300">{formatCurrency(Number(payment.amount))}</td><td className="px-5 py-4"><span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-200">{payment.payment_method}</span></td><td className="px-5 py-4 text-slate-300">{payment.collection_period?.period_key ?? "Unassigned"}</td><td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${periodClosed ? "bg-slate-500/15 text-slate-300" : "bg-emerald-500/15 text-emerald-300"}`}><Clock3 className="h-3 w-3" />{periodClosed ? "Closed period" : "Active period"}</span></td></tr>; })}</tbody></table></div>}
      </CardContent>
    </Card>
  );
}
