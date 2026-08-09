import {
  Card,
  CardContent,
} from "@/components/ui/card";

import {
  Users,
  CalendarClock,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

import { Member } from "@/types/member";


interface Props {
  members: Member[];
}



export default function StatsCards({
  members,
}: Props) {


  const totalMembers = members.length;



  const overdueMembers = members.filter(
    (member) =>
      new Date(member.next_due_date) < new Date()
  ).length;



  const dueToday = members.filter(
    (member) => {

      const today = new Date();

      const dueDate = new Date(
        member.next_due_date
      );


      return (
        today.getFullYear() === dueDate.getFullYear() &&
        today.getMonth() === dueDate.getMonth() &&
        today.getDate() === dueDate.getDate()
      );

    }
  ).length;



  const monthlyRevenue = members.reduce(
    (sum, member) => sum + Number(member.monthly_fee || 0),
    0
  );


  const cards = [

    {
      title: "Total Members",
      value: totalMembers.toLocaleString("en-IN"),
      icon: Users,
      gradient: "from-blue-500 to-indigo-600",
      glow: "shadow-blue-500/30",
      accent: "text-blue-500",
      softBg: "bg-blue-500/10",
      trend: `${totalMembers} registered`,
    },

    {
      title: "Monthly Revenue",
      value: `₹${monthlyRevenue.toLocaleString("en-IN")}`,
      icon: TrendingUp,
      gradient: "from-emerald-500 to-teal-600",
      glow: "shadow-emerald-500/30",
      accent: "text-emerald-500",
      softBg: "bg-emerald-500/10",
      trend: "combined monthly fees",
    },

    {
      title: "Due Today",
      value: dueToday,
      icon: CalendarClock,
      gradient: "from-amber-400 to-orange-500",
      glow: "shadow-amber-500/30",
      accent: "text-amber-500",
      softBg: "bg-amber-500/10",
      trend: "payments due today",
    },

    {
      title: "Overdue",
      value: overdueMembers,
      icon: AlertTriangle,
      gradient: "from-rose-500 to-red-600",
      glow: "shadow-rose-500/30",
      accent: "text-rose-500",
      softBg: "bg-rose-500/10",
      trend: overdueMembers > 0 ? "needs attention" : "all caught up",
    },

  ];




  return (

    <div
      className="
        grid
        gap-6
        md:grid-cols-2
        lg:grid-cols-4
      "
    >


      {
        cards.map((card) => {


          const Icon = card.icon;


          return (

            <Card

              key={card.title}

              className="
                relative
                overflow-hidden
                rounded-3xl
                border
                border-white/10
                bg-gradient-to-br
                from-slate-900
                to-slate-900/80
                shadow-xl
                backdrop-blur
                transition-all
                duration-300
                hover:-translate-y-1
                hover:shadow-2xl
              "

            >

              {/* Corner glow */}
              <div
                aria-hidden
                className={`
                  pointer-events-none
                  absolute
                  -top-10
                  -right-10
                  h-32
                  w-32
                  rounded-full
                  bg-gradient-to-br
                  ${card.gradient}
                  opacity-20
                  blur-2xl
                `}
              />


              <CardContent
                className="
                  p-6
                "
              >


                <div
                  className="
                    flex
                    items-center
                    justify-between
                  "
                >


                  <p
                    className="
                      text-sm
                      font-medium
                      text-slate-400
                    "
                  >
                    {card.title}
                  </p>


                  <div
                    className={`
                      flex
                      h-11
                      w-11
                      items-center
                      justify-center
                      rounded-xl
                      bg-gradient-to-br
                      ${card.gradient}
                      shadow-lg
                      ${card.glow}
                    `}
                  >

                    <Icon
                      className="
                        h-5
                        w-5
                        text-white
                      "
                    />

                  </div>


                </div>




                <h2
                  className="
                    mt-5
                    text-4xl
                    font-bold
                    tracking-tight
                    text-white
                    md:text-5xl
                  "
                >
                  {card.value}
                </h2>




                <p
                  className="
                    mt-3
                    text-xs
                    font-medium
                    text-slate-500
                  "
                >
                  {card.trend}
                </p>


              </CardContent>


            </Card>

          );


        })
      }


    </div>

  );

}
