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
} from "lucide-react";

import {
  Member,
} from "@/types/member";

import MemberActions from "./MemberActions";


interface Props {
  members: Member[];
}



export default function MembersTable({
  members,
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





  return (

    <Card
      className="
        rounded-3xl
        border
        border-slate-200
        bg-white
        shadow-lg
      "
    >

      <CardContent
        className="p-0"
      >



        <div
          className="
            flex
            flex-col
            gap-4
            border-b
            border-slate-100
            p-6
            md:flex-row
            md:items-center
            md:justify-between
          "
        >

          <div>

            <h2
              className="
                text-xl
                font-bold
                text-slate-900
              "
            >
              Members
            </h2>


            <p
              className="
                mt-1
                text-sm
                text-slate-500
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
                  text-slate-400
                "
              />


              <input

                className="
                  h-10
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  pl-10
                  pr-4
                  text-sm
                  text-slate-900
                  outline-none
                  transition
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-500/20
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





            <select

              className="
                h-10
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                text-sm
                text-slate-700
                outline-none
                focus:border-blue-500
              "

              value={filter}

              onChange={(e) =>
                setFilter(
                  e.target.value as
                  "all" |
                  "active" |
                  "overdue"
                )
              }

            >

              <option value="all">
                All Members
              </option>

              <option value="active">
                Active
              </option>

              <option value="overdue">
                Overdue
              </option>


            </select>


          </div>


        </div>






        {
          filteredMembers.length === 0

          ?

          (

            <div
              className="
                p-12
                text-center
              "
            >

              <p
                className="
                  font-medium
                  text-slate-700
                "
              >
                No members found
              </p>


              <p
                className="
                  mt-1
                  text-sm
                  text-slate-400
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
                      bg-slate-50
                      border-b
                    "
                  >

                    {
                      [
                        "Member",
                        "Phone",
                        "Email",
                        "Emergency Contact",
                        "Gender",
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
                            px-6
                            py-4
                            text-left
                            font-medium
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
                      (member) => (

                        <tr

                          key={member.id}

                          className="
                            border-b
                            border-slate-100
                            transition
                            hover:bg-blue-50/40
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
                                  items-center
                                  justify-center
                                  rounded-full
                                  bg-gradient-to-br
                                  from-blue-500
                                  to-indigo-600
                                  text-sm
                                  font-bold
                                  text-white
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
                                    font-semibold
                                    text-slate-900
                                  "
                                >

                                  {member.full_name}

                                </p>


                                <p
                                  className="
                                    text-xs
                                    text-slate-400
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





                          <td className="px-6 py-4 text-slate-700">

                            {member.phone}

                          </td>


                          <td className="px-6 py-4 text-slate-700">

                            {member.email || "-"}

                          </td>


                          <td className="px-6 py-4 text-slate-700">

                            {member.emergency_contact || "-"}

                          </td>


                          <td className="px-6 py-4 text-slate-700">

                            {member.gender || "-"}

                          </td>


                          <td className="px-6 py-4 text-slate-700">

                            {member.monthly_fee.toLocaleString("en-IN")}

                          </td>


                          <td className="px-6 py-4 text-slate-700">

                            {formatDate(member.join_date)}

                          </td>


                          <td className="px-6 py-4 text-slate-700">

                            {member.notes || "-"}

                          </td>


                          <td className="px-6 py-4 text-slate-700">

                            {formatDateTime(member.created_at)}

                          </td>


                          <td className="px-6 py-4 text-slate-700">

                            {formatDateTime(member.updated_at)}

                          </td>





                          <td className="px-6 py-4">


                            <Badge
                              className="
                                bg-blue-50
                                text-blue-700
                                hover:bg-blue-50
                              "
                            >

                              {member.membership_plan}

                            </Badge>


                          </td>





                          <td className="px-6 py-4 text-slate-700">

                            {
                              formatDate(
                                member.next_due_date
                              )
                            }

                          </td>





                          <td className="px-6 py-4">


                            {
                              isOverdue(
                                member.next_due_date
                              )

                              ?

                              <Badge
                                className="
                                  bg-red-100
                                  text-red-700
                                  hover:bg-red-100
                                "
                              >
                                Overdue
                              </Badge>


                              :

                              <Badge
                                className="
                                  bg-emerald-100
                                  text-emerald-700
                                  hover:bg-emerald-100
                                "
                              >
                                Active
                              </Badge>
                            }


                          </td>





                          <td className="px-6 py-4">

                            <MemberActions
                              member={member}
                            />

                          </td>


                        </tr>

                      )
                    )
                  }


                </tbody>


              </table>


            </div>

          )
        }



      </CardContent>


    </Card>

  );

}
