import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatsCards from "@/components/dashboard/StatsCards";
import MembersTable from "@/components/dashboard/MembersTable";
import { getMembers } from "@/lib/members";
import { getPaymentsSummary } from "@/lib/payments";

export default async function Home() {
  const [members, paymentSummary] = await Promise.all([
    getMembers(),
    getPaymentsSummary(),
  ]);

  return (
    <main className="ace-shell min-h-screen overflow-hidden bg-linear-to-br from-[#05071a] via-[#0a0e27] to-[#100828]">
      <div className="relative mx-auto max-w-[1600px] space-y-8 px-4 py-6 sm:px-6 sm:py-10"><div aria-hidden className="ace-grid-overlay pointer-events-none absolute inset-x-0 top-0 -z-10 h-[540px] opacity-70" />
        <div className="ace-reveal"><DashboardHeader /></div>
        <div className="ace-reveal ace-reveal-2"><StatsCards
            members={members}
            collectedThisMonth={paymentSummary.monthTotal}
            cashCollectedThisMonth={paymentSummary.cashTotal}
            upiCollectedThisMonth={paymentSummary.upiTotal}
            paymentCount={paymentSummary.count}
          /></div>
        <div className="ace-reveal ace-reveal-3"><MembersTable members={members} /></div>
      </div>
    </main>
  );
}
