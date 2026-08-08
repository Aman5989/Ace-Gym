"use client"

import * as React from "react"

import { cn } from "@/lib/utils"


function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {

  return (

    <textarea

      data-slot="textarea"

      className={cn(

        `
        flex

        min-h-28

        w-full


        rounded-xl


        border

        border-slate-200


        bg-white


        px-4

        py-3



        text-sm

        text-slate-900



        shadow-sm



        outline-none



        transition



        placeholder:text-slate-400




        focus:border-blue-500



        focus:ring-4

        focus:ring-blue-500/10




        disabled:cursor-not-allowed


        disabled:opacity-50



        aria-invalid:border-red-500



        `,

        className

      )}


      {...props}


    />

  )

}


export { Textarea }
