"use client";


import { Button } from "@/components/ui/button";

import { Plus, LogOut, Flame } from "lucide-react";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";


import MemberForm from "@/components/forms/MemberForm";
import MonthCloseButton from "@/components/dashboard/MonthCloseButton";

import { createClient } from "@/lib/supabase";


import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";



export default function DashboardHeader({ canCloseMonth = false, paymentCount = 0, total = 0 }: { canCloseMonth?: boolean; paymentCount?: number; total?: number }) {


  const [open, setOpen] = useState(false);


  const router = useRouter();




  async function handleLogout() {


    const supabase = createClient();



    const {
      error
    } = await supabase.auth.signOut();




    if (error) {


      console.log(
        "LOGOUT ERROR:",
        error
      );


      toast.error(
        "Logout failed"
      );


      return;

    }




    toast.success(
      "Logged out successfully"
    );



    router.push("/login");

    router.refresh();


  }




  return (

    <>

      <div
        className="
          ace-glass ace-shimmer ace-reveal ace-shell
          relative
          overflow-hidden
          rounded-3xl
          border
          border-white/10
          bg-gradient-to-br
          from-[#0a0e27]
          via-[#111740]
          to-[#1a0d33]
          p-8
          shadow-2xl
          shadow-indigo-950/40
          md:p-10
        "
      >

        {/* Decorative glow accents */}
        <div
          aria-hidden
          className="
            pointer-events-none
            absolute
            -top-24
            -right-24
            h-72
            w-72
            rounded-full
            bg-amber-400/20
            blur-3xl
          "
        />

        <div
          aria-hidden
          className="
            pointer-events-none
            absolute
            -bottom-32
            -left-20
            h-80
            w-80
            rounded-full
            bg-violet-500/20
            blur-3xl
          "
        />

        <div
          aria-hidden
          className="
            pointer-events-none
            absolute
            inset-0
            bg-[radial-gradient(circle_at_70%_20%,rgba(251,191,36,0.08),transparent_50%)]
          "
        />


        <div
          className="
            relative
            flex
            flex-col
            gap-6
            md:flex-row
            md:items-center
            md:justify-between
          "
        >


          {/* Brand block */}
          <div>


            <div
              className="
                flex
                items-center
                gap-2
                mb-3
              "
            >

              <img
                src="/acegym-icon.png"
                alt="ACE々GYM logo"
                className="
                  ace-float
                  h-10
                  w-auto
                  drop-shadow-[0_2px_6px_rgba(251,191,36,0.45)]
                "
              />


              <span
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-[0.25em]
                  text-amber-400/90
                "
              >
                Admin Dashboard
              </span>


            </div>


            <h1
              className="
                ace-reveal ace-reveal-1
                text-4xl
                font-black
                tracking-tight
                text-white
                md:text-5xl
              "
            >
              ACE<span className="text-amber-400">々</span>GYM
            </h1>




            <p
              className="
                mt-2
                text-sm
                text-slate-400
                md:text-base
              "
            >
              Manage members, subscriptions and monthly dues.
            </p>


          </div>




          {/* Actions */}
          <div
            className="
              flex
              items-center
              gap-3
            "
          >
            {canCloseMonth ? <MonthCloseButton paymentCount={paymentCount} total={total} /> : null}

            <Button

              onClick={() => setOpen(true)}

              className="
                ace-focus-ring
                rounded-xl
                bg-gradient-to-r
                from-amber-400
                to-orange-500
                font-semibold
                text-slate-950
                shadow-lg
                shadow-amber-500/30
                transition-all
                hover:from-amber-300
                hover:to-orange-400
                hover:shadow-amber-500/50
                h-11
                px-6
              "

            >

              <Plus
                className="
                  mr-2
                  h-5
                  w-5
                "
              />

              Add Member

            </Button>




            <Button

              onClick={handleLogout}

              variant="destructive"

              className="
                ace-focus-ring
                rounded-xl
                border
                border-red-500/30
                bg-red-500/10
                font-medium
                text-red-300
                backdrop-blur
                transition-all
                hover:bg-red-500/20
                h-11
                px-6
              "

            >

              <LogOut
                className="
                  mr-2
                  h-5
                  w-5
                "
              />

              Logout

            </Button>



          </div>


        </div>


        {/* Stat strip */}
        <div
          className="
            relative
            mt-8
            flex
            flex-wrap
            items-center
            gap-x-8
            gap-y-2
            border-t
            border-white/10
            pt-5
          "
        >

          <div className="flex items-center gap-2">

            <Flame className="h-4 w-4 text-amber-400" />

            <span className="text-xs font-medium text-slate-400">
              Powering your gym since day one
            </span>

          </div>

          <span className="hidden text-xs text-slate-600 sm:inline">
            Real-time member & dues management
          </span>

        </div>


      </div>




      <Dialog
        open={open}
        onOpenChange={setOpen}
      >


        <DialogContent

          className="
            max-w-xl
            max-h-[90vh]
            overflow-y-auto
            rounded-3xl
            bg-white
            text-slate-900
            border
            border-slate-200
            shadow-2xl
          "

        >


          <DialogHeader>


            <DialogTitle

              className="
                text-2xl
                font-bold
                text-slate-900
              "

            >

              Add New Member

            </DialogTitle>


          </DialogHeader>




          <div
            className="
              mt-2
            "
          >

            <MemberForm
              onSuccess={() => setOpen(false)}
            />

          </div>


        </DialogContent>


      </Dialog>



    </>

  );

}
