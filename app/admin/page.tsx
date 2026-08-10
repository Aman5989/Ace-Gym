import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatsCards from "@/components/dashboard/StatsCards";
import MembersTable from "@/components/dashboard/MembersTable";
import { getMembers } from "@/lib/members";
import { getPaymentsSummary } from "@/lib/payments";
import { getCurrentAppUser } from "@/lib/authorization";
import AdminPaymentLedger from "@/components/payments/AdminPaymentLedger";
import RoleManagement from "@/components/admin/RoleManagement";
import { getHeroImageUrl } from "@/lib/gym-settings";

export default async function Home() {
  const [{ role }, members, paymentSummary, heroImageUrl] = await Promise.all([
    getCurrentAppUser(),
    getMembers(),
    getPaymentsSummary(),
    getHeroImageUrl(),
  ]);
  const canViewPayments = role === "admin";
  const isTrainer = role === "trainer";

  return (
    <main className="ace-shell min-h-screen overflow-hidden bg-linear-to-br from-[#05071a] via-[#0a0e27] to-[#100828]">
      <div className="relative mx-auto max-w-[1600px] space-y-8 px-4 py-6 sm:px-6 sm:py-10">
        <div aria-hidden className="ace-grid-overlay pointer-events-none absolute inset-x-0 top-0 -z-10 h-[540px] opacity-70" />
        <div className="ace-reveal">
          <DashboardHeader
            canCloseMonth={canViewPayments}
            paymentCount={canViewPayments ? paymentSummary.count : 0}
            total={canViewPayments ? paymentSummary.monthTotal : 0}
            heroImageUrl={canViewPayments ? heroImageUrl : null}
            isTrainer={isTrainer}
          />
        </div>
        <div className="ace-reveal ace-reveal-2">
          <StatsCards
            members={members}
            collectedThisMonth={canViewPayments ? paymentSummary.monthTotal : 0}
            cashCollectedThisMonth={canViewPayments ? paymentSummary.cashTotal : 0}
            upiCollectedThisMonth={canViewPayments ? paymentSummary.upiTotal : 0}
            paymentCount={canViewPayments ? paymentSummary.count : 0}
            canViewPayments={canViewPayments}
          />
        </div>
        <div className="ace-reveal ace-reveal-3">
          <MembersTable members={members} canViewPayments={canViewPayments} canEditMembers={canViewPayments} canDeleteMembers={canViewPayments} />
        </div>
        {canViewPayments ? (
          <>
            <div className="ace-reveal ace-reveal-4">
              <AdminPaymentLedger />
            </div>
            <div className="ace-reveal ace-reveal-4">
              <RoleManagement />
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
