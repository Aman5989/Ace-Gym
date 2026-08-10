"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronDown, History, Loader2, ReceiptText, RefreshCw, UserCircle2, UserPlus, WalletCards } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PaymentWithMember, StaffDirectory, staffLabel } from "@/types/payment";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}
function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  if (!year || !month) return key;
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

const MIXED_METHODS = new Set(["upi + cash", "half upi + half cash"]);

/** Mirrors lib/payments.ts splitPayment so the ledger and the tiles always agree. */
function splitPayment(payment: PaymentWithMember) {
  const amount = Number(payment.amount || 0);
  const method = String(payment.payment_method ?? "").toLowerCase();
  const hasCash = payment.cash_amount !== null && payment.cash_amount !== undefined;
  const hasUpi = payment.upi_amount !== null && payment.upi_amount !== undefined;

  if (hasCash || hasUpi) {
    const cash = Number(payment.cash_amount || 0);
    const upi = Number(payment.upi_amount || 0);
    if (Math.abs(cash + upi - amount) < 0.01) return { cash, upi };
    if (hasCash && !hasUpi) return { cash, upi: Math.max(amount - cash, 0) };
    if (hasUpi && !hasCash) return { cash: Math.max(amount - upi, 0), upi };
  }

  if (method === "cash") return { cash: amount, upi: 0 };
  if (method === "upi") return { cash: 0, upi: amount };
  if (MIXED_METHODS.has(method)) return { cash: amount / 2, upi: amount / 2 };
  return { cash: 0, upi: amount };
}

function isRegistration(payment: PaymentWithMember) {
  const category = String(payment.fee_category ?? "").toLowerCase();
  if (category === "registration") return true;
  if (category === "renewal" || category === "adjustment") return false;
  return String(payment.notes ?? "").toLowerCase().includes("initial membership payment");
}

function methodLabel(method: string) {
  return method === "Half UPI + Half Cash" ? "UPI + Cash" : method;
}

type MonthGroup = {
  key: string;
  label: string;
  status: "open" | "closed";
  total: number;
  cash: number;
  upi: number;
  registration: number;
  renewal: number;
  registrationCount: number;
  renewalCount: number;
  count: number;
  payments: PaymentWithMember[];
  /** Who collected the money this month, highest first. */
  byStaff: { userId: string; total: number; count: number }[];
};

export default function AdminPaymentLedger() {
  const [payments, setPayments] = useState<PaymentWithMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [staff, setStaff] = useState<StaffDirectory>({});

  async function loadPayments() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/payments?all=true", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to load payment archive");
      setPayments(result.payments ?? []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load payment archive");
    } finally {
      setLoading(false);
    }
  }

  // Attribution is stored as a user id. Resolve it to readable staff names so
  // the ledger can show who took each admission.
  async function loadStaff() {
    try {
      const response = await fetch("/api/user-roles", { cache: "no-store" });
      if (!response.ok) return;
      const result = await response.json();
      const directory: StaffDirectory = {};
      for (const row of result.users ?? []) {
        const id = row.user_id ?? row.id;
        if (id) directory[id] = { email: row.email ?? "", role: row.role ?? "trainer" };
      }
      setStaff(directory);
    } catch {
      // Attribution labels are a convenience; the ledger still works without them.
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadPayments(); void loadStaff(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const months = useMemo<MonthGroup[]>(() => {
    const groups = new Map<string, MonthGroup>();
    for (const payment of payments) {
      // Group strictly by the actual payment date month. The period key is only
      // used to decide whether that month is still open for edits.
      const key = payment.payment_date.slice(0, 7);
      const current = groups.get(key) ?? {
        key,
        label: monthLabel(key),
        status: "closed",
        total: 0,
        cash: 0,
        upi: 0,
        registration: 0,
        renewal: 0,
        registrationCount: 0,
        renewalCount: 0,
        count: 0,
        payments: [],
        byStaff: [],
      };
      const amount = Number(payment.amount || 0);
      const { cash, upi } = splitPayment(payment);
      current.total += amount;
      current.cash += cash;
      current.upi += upi;
      current.count += 1;
      if (isRegistration(payment)) {
        current.registration += amount;
        current.registrationCount += 1;
      } else {
        current.renewal += amount;
        current.renewalCount += 1;
      }
      current.payments.push(payment);
      if (payment.collection_period?.status === "open") current.status = "open";
      groups.set(key, current);
    }
    for (const group of groups.values()) {
      group.payments.sort((a, b) => b.payment_date.localeCompare(a.payment_date) || b.created_at.localeCompare(a.created_at));
      const tally = new Map<string, { userId: string; total: number; count: number }>();
      for (const payment of group.payments) {
        const key = payment.recorded_by ?? "unattributed";
        const entry = tally.get(key) ?? { userId: key, total: 0, count: 0 };
        entry.total += Number(payment.amount || 0);
        entry.count += 1;
        tally.set(key, entry);
      }
      group.byStaff = [...tally.values()].sort((a, b) => b.total - a.total);
    }
    return Array.from(groups.values()).sort((a, b) => b.key.localeCompare(a.key));
  }, [payments]);

  const allTimeTotal = months.reduce((sum, month) => sum + month.total, 0);
  const allTimeCash = months.reduce((sum, month) => sum + month.cash, 0);
  const allTimeUpi = months.reduce((sum, month) => sum + month.upi, 0);
  const allTimeRegistration = months.reduce((sum, month) => sum + month.registration, 0);
  const allTimeRenewal = months.reduce((sum, month) => sum + month.renewal, 0);

  return (
    <Card className="ace-glass overflow-hidden rounded-3xl border-white/10 text-white">
      <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="mb-2 flex items-center gap-2 text-violet-300"><History className="h-4 w-4" /><span className="text-xs font-semibold uppercase tracking-[0.2em]">Financial archive</span></div>
          <CardTitle className="text-xl font-bold">Monthly collection master</CardTitle>
          <p className="mt-1 text-sm text-slate-400">Registration and renewal collections, month by month. Open any month to view every member payment.</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => void loadPayments()} disabled={loading} className="shrink-0 rounded-xl border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white" title="Refresh archive"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid gap-px border-b border-white/10 bg-white/10 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: "All-time collected", value: allTimeTotal, icon: WalletCards },
            { label: "Total Cash", value: allTimeCash, icon: ReceiptText },
            { label: "Total UPI", value: allTimeUpi, icon: ReceiptText },
            { label: "Registration Fees", value: allTimeRegistration, icon: UserPlus },
            { label: "Renewal Fees", value: allTimeRenewal, icon: RefreshCw },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-slate-950/40 px-5 py-4"><div className="flex items-center gap-2 text-xs text-slate-400"><Icon className="h-3.5 w-3.5" />{label}</div><p className="mt-1 text-lg font-bold text-white">{formatCurrency(value)}</p></div>
          ))}
        </div>
        {loading && <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading monthly archive…</div>}
        {error && <div className="m-5 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>}
        {!loading && !error && months.length === 0 && <div className="p-10 text-center text-sm text-slate-400">No payment transactions have been recorded yet.</div>}
        {!loading && !error && months.length > 0 && <div className="space-y-3 p-4 sm:p-5">
          {months.map((month) => {
            const expanded = expandedMonth === month.key;
            return <div key={month.key} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
              <button type="button" onClick={() => setExpandedMonth(expanded ? null : month.key)} className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-white/[0.05] sm:p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300"><CalendarDays className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-white">{month.label}</h3>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${month.status === "closed" ? "bg-slate-500/15 text-slate-300" : "bg-emerald-500/15 text-emerald-300"}`}>{month.status === "closed" ? "Verified" : "Active"}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{month.count} payment{month.count === 1 ? "" : "s"} · Cash {formatCurrency(month.cash)} · UPI {formatCurrency(month.upi)}</p>
                  <p className="mt-1 text-xs text-slate-400"><span className="text-violet-300">Registration {formatCurrency(month.registration)}</span> ({month.registrationCount}) · <span className="text-amber-300">Renewal {formatCurrency(month.renewal)}</span> ({month.renewalCount})</p>
                  {month.byStaff.length > 1 ? (
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
                      <UserCircle2 className="h-3 w-3" />
                      {month.byStaff.map((entry) => (
                        <span key={entry.userId} className="rounded-full bg-white/5 px-2 py-0.5">
                          {entry.userId === "unattributed" ? "Not attributed" : staffLabel(staff, entry.userId)} {formatCurrency(entry.total)}
                        </span>
                      ))}
                    </p>
                  ) : null}
                </div>
                <div className="hidden text-right sm:block"><p className="text-lg font-bold text-emerald-300">{formatCurrency(month.total)}</p><p className="text-[11px] text-slate-500">monthly collection</p></div>
                <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>
              {expanded && <div className="border-t border-white/10 bg-slate-950/25 px-4 py-3 sm:px-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Payment details</p>
                  <p className="text-sm font-bold text-emerald-300 sm:hidden">{formatCurrency(month.total)}</p>
                </div>
                <div className="space-y-2">
                  {month.payments.map((payment) => {
                    const registration = isRegistration(payment);
                    const { cash, upi } = splitPayment(payment);
                    const mixed = MIXED_METHODS.has(String(payment.payment_method).toLowerCase());
                    return (
                      <div key={payment.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-3 sm:px-4">
                        <div className="min-w-[150px] flex-1">
                          <p className="font-semibold text-white">{payment.member?.full_name ?? "Unknown member"}</p>
                          <p className="mt-1 text-xs text-slate-500">{payment.notes || (registration ? "Registration fee" : "Renewal fee")}</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${registration ? "bg-violet-500/15 text-violet-300" : "bg-amber-500/15 text-amber-300"}`}>{registration ? "Registration Fee" : "Renewal Fee"}</span>
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-400"><CalendarDays className="h-3.5 w-3.5" />{formatDate(payment.payment_date)}</span>
                        <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-300">{methodLabel(String(payment.payment_method))}</span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-slate-400" title="Recorded by">
                          <UserCircle2 className="h-3.5 w-3.5" />
                          {payment.recorded_by ? staffLabel(staff, payment.recorded_by) : "Not attributed"}
                        </span>
                        <span className="text-right">
                          <span className="block font-bold text-emerald-300">{formatCurrency(Number(payment.amount))}</span>
                          {mixed ? <span className="block text-[10px] text-slate-500">Cash {formatCurrency(cash)} · UPI {formatCurrency(upi)}</span> : null}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>}
            </div>;
          })}
        </div>}
      </CardContent>
    </Card>
  );
}
