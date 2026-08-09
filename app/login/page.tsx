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

    <main className="min-h-screen flex items-center justify-center bg-linear-to-br from-[#05071a] via-[#0a0e27] to-[#100828] px-4">

      <form
      onSubmit={handleLogin}
      className="
      w-full max-w-md
      rounded-3xl
      border
      border-white/10
      bg-slate-900/70
      backdrop-blur-xl
      p-8
      shadow-2xl
      shadow-black/40
      space-y-5
      "
      >

        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/40">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-slate-950"><path d="M6.5 6.5h11"/><path d="M6.5 17.5h11"/><path d="M6 20V4"/><path d="M18 20V4"/><path d="M4 10v4"/><path d="M20 10v4"/></svg>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">
              ACE<span className="text-amber-400">々</span>GYM
            </h1>
          </div>

          <p className="text-sm text-slate-400">
            Admin Dashboard · Sign in to continue
          </p>
        </div>


        <div>
          <label className="text-sm font-medium text-slate-300">
            Email
          </label>

          <input
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          type="email"
          className="
          mt-1
          w-full
          rounded-xl
          border
          border-white/10
          bg-white/5
          px-3
          py-2
          text-white
          placeholder:text-slate-500
          outline-none
          transition
          focus:border-indigo-500/60
          focus:ring-2
          focus:ring-indigo-500/20
          "
          />
        </div>



        <div>
          <label className="text-sm font-medium text-slate-300">
            Password
          </label>

          <input
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          type="password"
          className="
          mt-1
          w-full
          rounded-xl
          border
          border-white/10
          bg-white/5
          px-3
          py-2
          text-white
          placeholder:text-slate-500
          outline-none
          transition
          focus:border-indigo-500/60
          focus:ring-2
          focus:ring-indigo-500/20
          "
          />
        </div>



        <button
        disabled={loading}
        className="
        w-full
        rounded-xl
        bg-gradient-to-r
        from-amber-400
        to-orange-500
        py-2.5
        text-slate-950
        font-bold
        shadow-lg
        shadow-amber-500/30
        transition-all
        hover:from-amber-300
        hover:to-orange-400
        hover:shadow-amber-500/50
        disabled:opacity-50
        "
        >

        {loading ? "Logging in..." : "Login"}

        </button>


      </form>

    </main>

  )
}
