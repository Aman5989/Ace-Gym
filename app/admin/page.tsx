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
    <main className="min-h-screen bg-linear-to-br from-[#05071a] via-[#0a0e27] to-[#100828]">
      <div className="mx-auto max-w-[1600px] space-y-8 px-4 py-6 sm:px-6 sm:py-10">
        <DashboardHeader />
        <StatsCards members={members} collectedThisMonth={paymentSummary.monthTotal} paymentCount={paymentSummary.count} />
        <MembersTable members={members} />
      </div>
    </main>
  );
}
