"use client";

import { useRouter } from "next/navigation";
import {
  Trash2,
} from "lucide-react";

import { toast } from "sonner";

import {
  Button,
} from "@/components/ui/button";

import {
  Member,
} from "@/types/member";

import { createClient } from "@/lib/supabase";

import EditMemberDialog from "./EditMemberDialog";


import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";



interface Props {
  member: Member;
}



export default function MemberActions({
  member,
}: Props) {


  const router = useRouter();


  const supabase = createClient()


  async function deleteMember() {


    const {
      error,
    } = await supabase
      .from("members")
      .delete()
      .eq(
        "id",
        member.id
      );



    if(error){

      toast.error(
        "Failed to delete member"
      );

      return;

    }



    toast.success(
      "Member deleted"
    );


    router.refresh();

  }





  return (

    <div
      className="
        flex
        items-center
        gap-2
      "
    >



      <EditMemberDialog
        member={member}
      />





      <AlertDialog>


        <AlertDialogTrigger asChild>


          <Button

            variant="ghost"

            size="icon"

            className="
              h-9
              w-9
              rounded-xl
              text-slate-400
              transition
              hover:bg-red-50
              hover:text-red-600
            "

          >


            <Trash2
              className="
                h-4
                w-4
              "
            />


          </Button>


        </AlertDialogTrigger>






        <AlertDialogContent

          className="
            rounded-2xl
            bg-white
            text-slate-900
            border
            border-slate-200
          "

        >


          <AlertDialogHeader>


            <AlertDialogTitle
              className="
                text-xl
                font-bold
              "
            >

              Delete Member?

            </AlertDialogTitle>




            <AlertDialogDescription

              className="
                text-slate-500
              "

            >

              Are you sure you want to remove{" "}

              <span
                className="
                  font-semibold
                  text-slate-900
                "
              >

                {member.full_name}

              </span>

              ?

              <br />

              This action cannot be undone.


            </AlertDialogDescription>



          </AlertDialogHeader>






          <AlertDialogFooter>


            <AlertDialogCancel

              className="
                rounded-xl
              "

            >

              Cancel

            </AlertDialogCancel>





            <AlertDialogAction

              onClick={deleteMember}

              className="
                rounded-xl
                bg-red-600
                hover:bg-red-700
                text-white
              "

            >

              Delete

            </AlertDialogAction>



          </AlertDialogFooter>



        </AlertDialogContent>



      </AlertDialog>



    </div>

  );

}
