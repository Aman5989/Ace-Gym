"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase"
import { toast } from "sonner"
import { useRouter } from "next/navigation"


export default function LoginPage() {

  const router = useRouter()

  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")
  const [loading,setLoading] = useState(false)


  async function handleLogin(e: React.FormEvent){

    e.preventDefault()

    setLoading(true)


    const supabase = createClient()


    const {error} = await supabase.auth.signInWithPassword({
      email,
      password
    })


    if(error){
      toast.error(error.message)
      setLoading(false)
      return
    }


    toast.success("Login successful")

    router.push("/")
    router.refresh()

  }


  return (

    <main className="min-h-screen flex items-center justify-center bg-slate-950 px-4">

      <form
      onSubmit={handleLogin}
      className="
      w-full max-w-md
      rounded-2xl
      bg-white
      p-8
      shadow-xl
      space-y-5
      "
      >

        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Admin Login
          </h1>

          <p className="text-sm text-slate-500">
            Ace Gym Dashboard
          </p>
        </div>


        <div>
          <label className="text-sm text-slate-700">
            Email
          </label>

          <input
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          type="email"
          className="
          mt-1
          w-full
          rounded-lg
          border
          border-slate-300
          bg-white
          px-3
          py-2
          text-slate-900
          outline-none
          focus:ring-2
          focus:ring-blue-500
          "
          />
        </div>



        <div>
          <label className="text-sm text-slate-700">
            Password
          </label>

          <input
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          type="password"
          className="
          mt-1
          w-full
          rounded-lg
          border
          border-slate-300
          bg-white
          px-3
          py-2
          text-slate-900
          outline-none
          focus:ring-2
          focus:ring-blue-500
          "
          />
        </div>



        <button
        disabled={loading}
        className="
        w-full
        rounded-lg
        bg-blue-600
        py-2.5
        text-white
        font-medium
        hover:bg-blue-700
        disabled:opacity-50
        "
        >

        {loading ? "Logging in..." : "Login"}

        </button>


      </form>

    </main>

  )
}
