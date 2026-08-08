import { createClient } from "@/lib/supabase";

import { Member } from "@/types/member";


export async function getMembers(): Promise<Member[]> {
  const supabase = createClient();

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

}
