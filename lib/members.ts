import { cache } from "react";
import { createClient } from "@/lib/supabase-server";
import { Member } from "@/types/member";

export const getMembers = cache(async (): Promise<Member[]> => {
  const supabase = await createClient();

  const {
    data,
    error
  } = await supabase
    .from("members")
    .select("*")
    .order(
      "created_at",
      {
        ascending:false
      }
    );


  if(error){
    console.error(error);
    return [];
  }


  return data as Member[];
});
