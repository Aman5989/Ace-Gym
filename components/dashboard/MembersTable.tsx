"use client";

import { useState } from "react";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import {
  Badge,
} from "@/components/ui/badge";

import {
  Search,
  SlidersHorizontal,
  Users,
} from "lucide-react";

import {
  Member,
} from "@/types/member";

import MemberActions from "./MemberActions";


interface Props {
  members: Member[];
  canViewPayments?: boolean;
}



export default function MembersTable({
  members,
  canViewPayments = true,
}: Props) {


  const [search, setSearch] = useState("");

  const [filter, setFilter] = useState<
    "all" | "active" | "overdue"
  >("all");




  function getInitials(name: string) {

    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  }




  function formatDate(date: string) {

    return new Date(date)
      .toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );

  }

  function formatDateTime(date: string) {
    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }




  function isOverdue(date: string) {

    return new Date(date) < new Date();

  }




  function daysUntil(date: string) {

    const due = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diff = Math.ceil(
      (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diff;

  }




  const filteredMembers = members.filter(
    (member) => {

      const matchesSearch =
        member.full_name
          .toLowerCase()
          .includes(
            search.toLowerCase()
          )
        ||
        member.phone.includes(search);



      const overdue =
        isOverdue(
          member.next_due_date
        );



      const matchesFilter =
        filter === "all"
        ||
        (
          filter === "overdue"
          &&
          overdue
        )
        ||
        (
          filter === "active"
          &&
          !overdue
        );



      return (
        matchesSearch
        &&
        matchesFilter
      );

    }
  );

  const filterCounts = {
    all: members.length,
    active: members.filter((m) => !isOverdue(m.next_due_date)).length,
    overdue: members.filter((m) => isOverdue(m.next_due_date)).length,
  };



  return (

    <Card
      className="
        overflow-hidden
        rounded-3xl
        border
        border-white/10
        bg-gradient-to-br
        from-slate-900
        to-slate-900/80
        shadow-xl
      "
    >

      <CardContent
        className="p-0"
      >



        {/* Toolbar */}
        <div
          className="
            flex
            flex-col
            gap-4
            border-b
            border-white/10
            p-6
            md:flex-row
            md:items-center
            md:justify-between
          "
        >

          <div>

            <div className="flex items-center gap-2">

              <div
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-xl
                  bg-gradient-to-br
                  from-indigo-500
                  to-violet-600
                  shadow-lg
                  shadow-indigo-500/30
                "
              >
                <Users className="h-4 w-4 text-white" />
              </div>

              <h2
                className="
                  text-xl
                  font-bold
                  text-white
                "
              >
                Members
              </h2>

              <Badge
                className="
                  rounded-full
                  bg-white/10
                  px-2.5
                  py-0.5
                  font-medium
                  text-slate-300
                "
              >
                {filteredMembers.length}
              </Badge>

            </div>


            <p
              className="
                mt-2
                text-sm
                text-slate-400
              "
            >
              Manage members and subscription status.
            </p>

          </div>




          <div
            className="
              flex
              flex-col
              gap-3
              sm:flex-row
            "
          >


            <div
              className="
                relative
              "
            >

              <Search
                className="
                  absolute
                  left-3
                  top-1/2
                  h-4
                  w-4
                  -translate-y-1/2
                  text-slate-500
                "
              />


              <input

                className="
                  h-10
                  w-full
                  rounded-xl
                  border
                  border-white/10
                  bg-white/5
                  pl-10
                  pr-4
                  text-sm
                  text-white
                  placeholder:text-slate-500
                  outline-none
                  transition
                  focus:border-indigo-500/60
                  focus:ring-2
                  focus:ring-indigo-500/20
                  sm:w-64
                "

                placeholder="Search members..."

                value={search}

                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }

              />

            </div>




            <div
              className="
                flex
                items-center
                gap-1.5
                rounded-xl
                border
                border-white/10
                bg-white/5
                p-1
              "
            >

              <SlidersHorizontal
                className="
                  ml-2
                  h-4
                  w-4
                  text-slate-500
                "
              />

              {(
                [
                  ["all", "All", "all"],
                  ["active", "Active", "active"],
                  ["overdue", "Overdue", "overdue"],
                ] as const
              ).map(([value, label, key]) => (

                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={`
                    flex
                    items-center
                    gap-1.5
                    rounded-lg
                    px-3
                    py-1.5
                    text-sm
                    font-medium
                    transition
                    ${
                      filter === value
                        ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30"
                        : "text-slate-400 hover:text-white"
                    }
                  `}
                >
                  {label}
                  <span
                    className={`
                      rounded-full
                      px-1.5
                      text-[11px]
                      ${
                        filter === value
                          ? "bg-white/20 text-white"
                          : "bg-white/5 text-slate-500"
                      }
                    `}
                  >
                    {filterCounts[key]}
                  </span>
                </button>

              ))}

            </div>


          </div>


        </div>





        {
          filteredMembers.length === 0

          ?

          (

            <div
              className="
                flex
                flex-col
                items-center
                justify-center
                gap-2
                p-16
              "
            >

              <div
                className="
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-2xl
                  bg-white/5
                  border
                  border-white/10
                "
              >
                <Search className="h-6 w-6 text-slate-500" />
              </div>

              <p
                className="
                  mt-2
                  font-medium
                  text-slate-300
                "
              >
                No members found
              </p>


              <p
                className="
                  text-sm
                  text-slate-500
                "
              >
                Try changing your search or filter.
              </p>


            </div>

          )

          :

          (

            <div
              className="
                overflow-x-auto
              "
            >

              <table
                className="
                  w-full
                  text-sm
                "
              >


                <thead>

                  <tr
                    className="
                      border-b
                      border-white/10
                      bg-white/[0.03]
                    "
                  >

                    {
                      [
                        "Member",
                        "Phone",
                        "Email",
                        "Emergency Contact",
                        "Gender",
                        "Timing",
                        "Monthly Fee",
                        "Join Date",
                        "Notes",
                        "Created",
                        "Updated",
                        "Plan",
                        "Due Date",
                        "Due Status",
                        "Actions",
                      ].map((heading) => (

                        <th

                          key={heading}

                          className="
                            whitespace-nowrap
                            px-6
                            py-4
                            text-left
                            text-xs
                            font-semibold
                            uppercase
                            tracking-wider
                            text-slate-500
                          "

                        >

                          {heading}

                        </th>

                      ))
                    }


                  </tr>

                </thead>




                <tbody>


                  {
                    filteredMembers.map(
                      (member) => {

                        const overdue = isOverdue(member.next_due_date);
                        const days = daysUntil(member.next_due_date);


                        return (

                        <tr

                          key={member.id}

                          className="
                            border-b
                            border-white/5
                            transition
                            hover:bg-white/[0.04]
                          "

                        >



                          <td className="px-6 py-4">


                            <div
                              className="
                                flex
                                items-center
                                gap-3
                              "
                            >


                              <div
                                className="
                                  flex
                                  h-11
                                  w-11
                                  shrink-0
                                  items-center
                                  justify-center
                                  rounded-full
                                  bg-gradient-to-br
                                  from-indigo-500
                                  to-violet-600
                                  text-sm
                                  font-bold
                                  text-white
                                  shadow-md
                                  shadow-indigo-500/25
                                "
                              >

                                {
                                  getInitials(
                                    member.full_name
                                  )
                                }

                              </div>




                              <div>

                                <p
                                  className="
                                    whitespace-nowrap
                                    font-semibold
                                    text-white
                                  "
                                >

                                  {member.full_name}

                                </p>


                                <p
                                  className="
                                    text-xs
                                    text-slate-500
                                  "
                                >

                                  Joined{" "}
                                  {
                                    formatDate(
                                      member.join_date
                                    )
                                  }

                                </p>


                              </div>


                            </div>


                          </td>




                          <td className="px-6 py-4 text-slate-300">

                            {member.phone}

                          </td>


                          <td className="px-6 py-4 text-slate-300">

                            {member.email || "-"}

                          </td>


                          <td className="px-6 py-4 text-slate-300">

                            {member.emergency_contact || "-"}

                          </td>


                          <td className="px-6 py-4 text-slate-300">

                            {member.gender || "-"}

                          </td>

                          <td className="px-6 py-4">
                            <Badge
                              className="rounded-full bg-cyan-500/15 font-medium text-cyan-300 hover:bg-cyan-500/15"
                            >
                              {member.timing || "-"}
                            </Badge>
                          </td>

                          <td className="px-6 py-4">

                            <span className="font-semibold text-white">
                              ₹{member.monthly_fee.toLocaleString("en-IN")}
                            </span>

                          </td>


                          <td className="px-6 py-4 text-slate-300">

                            {formatDate(member.join_date)}

                          </td>


                          <td className="px-6 py-4 text-slate-300">

                            {member.notes || "-"}

                          </td>


                          <td className="px-6 py-4 text-slate-300">

                            {formatDateTime(member.created_at)}

                          </td>


                          <td className="px-6 py-4 text-slate-300">

                            {formatDateTime(member.updated_at)}

                          </td>





                          <td className="px-6 py-4">


                            <Badge
                              className="
                                rounded-full
                                bg-indigo-500/15
                                font-medium
                                text-indigo-300
                                hover:bg-indigo-500/15
                              "
                            >

                              {member.membership_plan}

                            </Badge>


                          </td>




                          <td className="px-6 py-4 text-slate-300">

                            {
                              formatDate(
                                member.next_due_date
                              )
                            }

                          </td>




                          <td className="px-6 py-4">


                            {
                              overdue

                              ?

                              <div className="flex items-center gap-2">

                                <Badge
                                  className="
                                    rounded-full
                                    bg-rose-500/15
                                    font-medium
                                    text-rose-300
                                    hover:bg-rose-500/15
                                  "
                                >
                                  Overdue
                                </Badge>

                                <span className="text-xs text-rose-400/80">
                                  {Math.abs(days)}d late
                                </span>

                              </div>

                              :

                              <div className="flex items-center gap-2">

                                <Badge
                                  className="
                                    rounded-full
                                    bg-emerald-500/15
                                    font-medium
                                    text-emerald-300
                                    hover:bg-emerald-500/15
                                  "
                                >
                                  Active
                                </Badge>

                                {days <= 15 && days >= 0 && (
                                  <span className="text-xs text-amber-400/90">
                                    due in {days}d
                                  </span>
                                )}

                              </div>
                            }


                          </td>




                          <td className="px-6 py-4">

                            <MemberActions member={member} canViewPayments={canViewPayments} />

                          </td>


                        </tr>

                      );

                      }
                    )
                  }


                </tbody>


              </table>


            </div>

          )
        }


        {/* Footer strip */}
        <div
          className="
            flex
            items-center
            justify-between
            border-t
            border-white/10
            bg-white/[0.02]
            px-6
            py-3.5
          "
        >

          <p className="text-xs text-slate-500">
            Showing {filteredMembers.length} of {members.length} members
          </p>

          <p className="text-xs font-medium text-slate-500">
            ACE々GYM · Admin
          </p>

        </div>


      </CardContent>


    </Card>

  );

}
