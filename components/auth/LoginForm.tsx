"use client";


import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { toast } from "sonner";


import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";


import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";


import { createClient } from "@/lib/supabase";



export default function LoginForm() {


  const supabase = useMemo(
    () => createClient(),
    []
  );
  const router = useRouter();



  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);





  async function handleLogin(
    e: React.FormEvent
  ) {

    e.preventDefault();


    setLoading(true);



    try {


      const {
        error
      } = await supabase.auth.signInWithPassword({

        email,

        password,

      });





      if (error) {


        console.log(
          "LOGIN ERROR:",
          error
        );


        toast.error(
          error.message
        );


        return;

      }





            toast.success("Login successful");
      router.replace("/admin");
      router.refresh();


    } catch (error) {


      console.log(
        "LOGIN FAILED:",
        error
      );


      toast.error(
        "Something went wrong"
      );


    } finally {


      setLoading(false);


    }


  }





    return (
    <>
      {loading ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md">
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/10 px-10 py-8 text-center shadow-2xl">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 shadow-lg shadow-amber-500/25">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
            </div>
            <div>
              <p className="font-semibold text-white">Entering ACE々GYM</p>
              <p className="mt-1 text-sm text-slate-300">Preparing your dashboard…</p>
            </div>
          </div>
        </div>
      ) : null}
      <Card
      className="
        w-full
        max-w-md
        rounded-2xl
        shadow-xl
        border-0
      "
    >


      <CardHeader>


        <CardTitle
          className="
            text-center
            text-2xl
            text-slate-900
          "
        >

          ACE々GYM Admin

        </CardTitle>


      </CardHeader>





      <CardContent>


        <form
          onSubmit={handleLogin}
          className="
            space-y-5
          "
        >




          <div>


            <label
              className="
                text-sm
                font-medium
                text-slate-700
              "
            >

              Email

            </label>




            <Input

              type="email"

              value={email}


              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }


              placeholder="admin@example.com"


              required

            />


          </div>







          <div>


            <label
              className="
                text-sm
                font-medium
                text-slate-700
              "
            >

              Password

            </label>





            <Input


              type="password"


              value={password}



              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }



              placeholder="••••••••"



              required


            />


          </div>







          <Button


            type="submit"


            disabled={loading}


            className="
              w-full
              h-11
              rounded-xl
              bg-blue-600
              hover:bg-blue-700
            "

          >


            {
              loading
              ? "Signing in..."
              : "Login"
            }


          </Button>





        </form>



      </CardContent>



      </Card>
    </>

  );

}
