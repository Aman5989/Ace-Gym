"use client";


import { Button } from "@/components/ui/button";

import { Plus, LogOut } from "lucide-react";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";


import MemberForm from "@/components/forms/MemberForm";

import { createClient } from "@/lib/supabase";


import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";



export default function DashboardHeader() {


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
          flex
          items-center
          justify-between
          rounded-3xl
          bg-linear-to-r
          from-slate-900
          via-slate-800
          to-slate-900
          border
          border-slate-700
          p-6
          shadow-xl
        "
      >


        <div>


          <div
            className="
              flex
              items-center
              gap-2
              mb-2
            "
          >

            <div
              className="
                h-2
                w-2
                rounded-full
                bg-emerald-400
                shadow-lg
                shadow-emerald-400/50
              "
            />


            <span
              className="
                text-sm
                font-medium
                text-emerald-400
              "
            >
              Admin Dashboard
            </span>


          </div>





          <h1
            className="
              text-4xl
              font-bold
              tracking-tight
              text-white
            "
          >
            Gym Manager
          </h1>





          <p
            className="
              mt-2
              text-slate-400
              text-sm
            "
          >
            Manage members, subscriptions and monthly dues.
          </p>


        </div>







        <div
          className="
            flex
            items-center
            gap-3
          "
        >



          <Button

            onClick={() => setOpen(true)}

            className="
              rounded-xl
              bg-blue-500
              hover:bg-blue-600
              text-white
              px-5
              h-11
              shadow-lg
              shadow-blue-500/30
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
              rounded-xl
              h-11
              px-5
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
