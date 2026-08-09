import { AlertTriangle, Banknote, CalendarClock, CircleDollarSign, CreditCard, Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/payment-utils";
import { Member } from "@/types/member";

interface Props {
  members: Member[];
  collectedThisMonth?: number;
  cashCollectedThisMonth?: number;
  upiCollectedThisMonth?: number;
  paymentCount?: number;
}

export default function StatsCards({ members, collectedThisMonth = 0, cashCollectedThisMonth = 0, upiCollectedThisMonth = 0, paymentCount = 0 }: Props) {
  const today = new Date();
  const totalMembers = members.length;
  const overdueMembers = members.filter((member) => new Date(`${member.next_due_date}T23:59:59`) < today).length;
  const dueToday = members.filter((member) => {
    const dueDate = new Date(`${member.next_due_date}T00:00:00`);
    return today.getFullYear() === dueDate.getFullYear() && today.getMonth() === dueDate.getMonth() && today.getDate() === dueDate.getDate();
  }).length;

  const cards = [
    { title: "Total Members", value: totalMembers.toLocaleString("en-IN"), icon: Users, gradient: "from-blue-500 to-indigo-600", glow: "shadow-blue-500/30", trend: `${totalMembers} registered` },
    { title: "Collected This Month", value: formatCurrency(collectedThisMonth), icon: CircleDollarSign, gradient: "from-emerald-500 to-teal-600", glow: "shadow-emerald-500/30", trend: `${paymentCount} payment${paymentCount === 1 ? "" : "s"} recorded` },
    { title: "Due Today", value: dueToday, icon: CalendarClock, gradient: "from-amber-400 to-orange-500", glow: "shadow-amber-500/30", trend: "payments due today" },
    { title: "Overdue", value: overdueMembers, icon: AlertTriangle, gradient: "from-rose-500 to-red-600", glow: "shadow-rose-500/30", trend: overdueMembers > 0 ? "needs attention" : "all caught up" },
  ];

  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className={`ace-glass ace-reveal ace-reveal-${index + 1} group relative overflow-hidden rounded-3xl transition-all duration-500 hover:-translate-y-2 hover:border-white/20 hover:shadow-2xl`}>
            <div aria-hidden className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${card.gradient} opacity-20 blur-2xl transition-transform duration-700 group-hover:scale-150`} />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-400">{card.title}</p><div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg ${card.glow}`}><Icon className="h-5 w-5 text-white" /></div></div>
              <h2 className="mt-5 text-3xl font-bold tracking-tight text-white transition-transform duration-500 group-hover:translate-x-1 md:text-4xl">{card.value}</h2>
              {card.title === "Collected This Month" ? (
                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
                  <div className="flex items-center gap-2 rounded-xl bg-white/5 px-2.5 py-2">
                    <Banknote className="h-3.5 w-3.5 text-emerald-300" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">Cash</p>
                      <p className="text-xs font-semibold text-emerald-200">{formatCurrency(cashCollectedThisMonth)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-white/5 px-2.5 py-2">
                    <CreditCard className="h-3.5 w-3.5 text-cyan-300" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">UPI</p>
                      <p className="text-xs font-semibold text-cyan-200">{formatCurrency(upiCollectedThisMonth)}</p>
                    </div>
                  </div>
                </div>
              ) : null}
              <p className="mt-3 text-xs font-medium text-slate-500">{card.trend}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
