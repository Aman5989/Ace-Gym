import {
    Card,
    CardContent,
  } from "@/components/ui/card";
  
  import {
    Users,
    CalendarClock,
    AlertTriangle,
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
  
  
  
  
    const cards = [
  
      {
        title: "Total Members",
        value: totalMembers,
        icon: Users,
        iconBg: "bg-blue-500/10",
        iconColor: "text-blue-500",
        valueColor: "text-slate-900",
      },
  
  
      {
        title: "Due Today",
        value: dueToday,
        icon: CalendarClock,
        iconBg: "bg-emerald-500/10",
        iconColor: "text-emerald-500",
        valueColor: "text-slate-900",
      },
  
  
      {
        title: "Overdue",
        value: overdueMembers,
        icon: AlertTriangle,
        iconBg: "bg-red-500/10",
        iconColor: "text-red-500",
        valueColor: "text-slate-900",
      },
  
    ];
  
  
  
  
  
    return (
  
      <div
        className="
          grid
          gap-6
          md:grid-cols-3
        "
      >
  
  
        {
          cards.map((card) => {
  
  
            const Icon = card.icon;
  
  
            return (
  
              <Card
  
                key={card.title}
  
                className="
                  rounded-3xl
                  border
                  border-slate-200
                  bg-white
                  shadow-lg
                  transition-all
                  duration-300
                  hover:-translate-y-1
                  hover:shadow-2xl
                "
  
              >
  
  
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
                        text-slate-500
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
                        ${card.iconBg}
                      `}
                    >
  
                      <Icon
                        className={`
                          h-5
                          w-5
                          ${card.iconColor}
                        `}
                      />
  
                    </div>
  
  
                  </div>
  
  
  
  
  
                  <h2
                    className={`
                      mt-5
                      text-5xl
                      font-bold
                      tracking-tight
                      ${card.valueColor}
                    `}
                  >
                    {card.value}
                  </h2>
  
  
  
                  <p
                    className="
                      mt-2
                      text-xs
                      text-slate-400
                    "
                  >
                    Updated automatically
                  </p>
  
  
                </CardContent>
  
  
              </Card>
  
            );
  
  
          })
        }
  
  
      </div>
  
    );
  
  }
  