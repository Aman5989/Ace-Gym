"use client";


import { useMemo, useState } from "react";

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





      const {
        data
      } = await supabase.auth.getSession();



      console.log(
        "SESSION:",
        data.session
      );





      toast.success(
        "Login successful"
      );



      await new Promise(
        (resolve) => setTimeout(resolve, 500)
      );
      
      
      window.location.assign("/admin");


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

  );

}
