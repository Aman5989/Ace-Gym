import { Banknote, CreditCard, ReceiptText, UserPlus } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/payment-utils";
import { splitPayment } from "@/lib/payments";
import { Payment, feeCategoryLabel } from "@/types/payment";
import { Member } from "@/types/member";

interface Props {
  payments: Payment[];
  members: Member[];
  total: number;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/**
 * A trainer's own record of the admissions they took this month.
 *
 * This exists because a trainer previously had no way to confirm that an
 * admission had actually been banked, which is what led to the same member
 * being keyed in twice. It deliberately shows only rows attributed to the
 * signed-in trainer; the gym's full collection stays with the administrator.
 */
export default function TrainerCollectionPanel({ payments, members, total }: Props) {
  const memberNames = new Map(members.map((member) => [member.id, member.full_name]));
  const cashTotal = payments.reduce((sum, payment) => sum + splitPayment(payment).cash, 0);
  const upiTotal = payments.reduce((sum, payment) => sum + splitPayment(payment).upi, 0);

  return (
    <Card className="ace-glass overflow-hidden rounded-3xl">
      <CardHeader className="flex flex-col gap-4 border-b border-white/10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/30">
            <ReceiptText className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg text-white">My admissions this month</CardTitle>
            <p className="mt-0.5 text-xs text-slate-400">
              Registration fees you collected. These are included in the gym&apos;s monthly collection.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-xl bg-white/5 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Total</p>
            <p className="text-sm font-semibold text-violet-200">{formatCurrency(total)}</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
            <Banknote className="h-3.5 w-3.5 text-emerald-300" />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-500">Cash</p>
              <p className="text-sm font-semibold text-emerald-200">{formatCurrency(cashTotal)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
            <CreditCard className="h-3.5 w-3.5 text-cyan-300" />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-500">UPI</p>
              <p className="text-sm font-semibold text-cyan-200">{formatCurrency(upiTotal)}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {payments.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <UserPlus className="h-8 w-8 text-slate-600" />
            <p className="text-sm font-medium text-slate-300">No admissions recorded by you yet this month</p>
            <p className="text-xs text-slate-500">
              Use Add Member to take an admission. The registration fee is recorded automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Member</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Method</th>
                  <th className="px-6 py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => {
                  const { cash, upi } = splitPayment(payment);
                  const isMixed = cash > 0 && upi > 0;
                  return (
                    <tr key={payment.id} className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/5">
                      <td className="px-6 py-3 font-medium text-white">
                        {memberNames.get(payment.member_id) ?? "Member"}
                      </td>
                      <td className="px-4 py-3 text-slate-400">{formatDate(payment.payment_date)}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="border-violet-400/30 bg-violet-500/10 text-[11px] text-violet-200">
                          {feeCategoryLabel(payment.fee_category)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {payment.payment_method}
                        {isMixed ? (
                          <span className="ml-1 text-xs text-slate-500">
                            ({formatCurrency(cash)} cash + {formatCurrency(upi)} UPI)
                          </span>
                        ) : null}
                      </td>
                      <td className="px-6 py-3 text-right font-semibold text-white">
                        {formatCurrency(Number(payment.amount || 0))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
