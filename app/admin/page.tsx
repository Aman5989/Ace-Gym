import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatsCards from "@/components/dashboard/StatsCards";
import MembersTable from "@/components/dashboard/MembersTable";

import { getMembers } from "@/lib/members";


export default async function Home() {

  const members = await getMembers();


  return (

    <main className="
      min-h-screen
      bg-linear-to-br
      from-slate-950
      via-slate-900
      to-slate-800
    ">

      <div className="
        mx-auto
        max-w-7xl
        px-6
        py-10
        space-y-8
      ">


        <DashboardHeader />


        <StatsCards
          members={members}
        />


        <MembersTable
          members={members}
        />


      </div>


    </main>

  );
}
