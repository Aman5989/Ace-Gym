"use client";

import { useState } from "react";

import {
  Pencil,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Button,
} from "@/components/ui/button";

import MemberForm from "@/components/forms/MemberForm";

import {
  Member,
} from "@/types/member";



interface Props {
  member: Member;
}



export default function EditMemberDialog({
  member,
}: Props) {


  const [open, setOpen] = useState(false);



  return (

    <>


      <Button

        variant="ghost"

        size="icon"

        onClick={() => setOpen(true)}

        className="
          h-9
          w-9
          rounded-xl
          text-slate-400
          transition
          hover:bg-blue-50
          hover:text-blue-600
        "

      >

        <Pencil
          className="
            h-4
            w-4
          "
        />

      </Button>






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

              Edit Member

            </DialogTitle>


            <p
              className="
                text-sm
                text-slate-500
              "
            >
              Update member information and subscription details.
            </p>


          </DialogHeader>





          <div
            className="
              mt-3
            "
          >


            <MemberForm

              member={member}

              onSuccess={() => setOpen(false)}

            />


          </div>





        </DialogContent>




      </Dialog>



    </>

  );

}
