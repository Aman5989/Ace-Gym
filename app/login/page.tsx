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

    <main className="ace-shell relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-[#05071a] via-[#0a0e27] to-[#100828] px-4 py-10">

      <div aria-hidden className="ace-grid-overlay pointer-events-none absolute inset-0 opacity-60" />
      <div aria-hidden className="ace-float pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-24 bottom-1/4 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />

      <form
      onSubmit={handleLogin}
      className="
      ace-glass ace-shimmer ace-reveal relative
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

        <div className="ace-reveal ace-reveal-1">
          <div className="mb-4 flex items-center gap-3">
            <img src="/acegym-icon.png" alt="ACE々GYM logo" className="ace-float h-12 w-auto drop-shadow-[0_2px_8px_rgba(251,191,36,0.45)]" />
            <h1 className="text-3xl font-black tracking-tight text-white">
              ACE<span className="text-amber-400">々</span>GYM
            </h1>
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300/80">
            Admin access
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Sign in to manage members, payments, and gym growth.
          </p>
        </div>


        <div className="ace-reveal ace-reveal-2">
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
          ace-focus-ring
          outline-none
          transition
          focus:border-indigo-500/60
          focus:ring-2
          focus:ring-indigo-500/20
          "
          />
        </div>



        <div className="ace-reveal ace-reveal-3">
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
          ace-focus-ring
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
        className="ace-reveal ace-reveal-4 ace-focus-ring group relative overflow-hidden
        
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

        <span className="relative z-10 flex items-center justify-center gap-2">
          {loading && <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />}
          {loading ? "Logging in..." : "Enter dashboard"}
        </span>

        </button>


        <p className="pt-1 text-center text-xs text-slate-500">Secure access for ACE々GYM administrators</p>
      </form>

    </main>

  )
}
