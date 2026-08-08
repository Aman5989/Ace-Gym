import * as React from "react";

import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/utils";


function Input({
  className,
  type,
  ...props
}: React.ComponentProps<"input">) {

  return (

    <InputPrimitive

      type={type}

      data-slot="input"

      className={cn(

        `
        h-11
        w-full
        min-w-0

        rounded-xl

        border
        border-slate-200

        bg-white

        px-3
        py-2

        text-sm
        text-slate-900

        shadow-sm

        transition

        outline-none

        placeholder:text-slate-400

        focus:border-blue-500

        focus:ring-4
        focus:ring-blue-500/10

        disabled:cursor-not-allowed
        disabled:opacity-50

        aria-invalid:border-red-500

        file:border-0
        file:bg-transparent

        dark:bg-white
        dark:text-slate-900
        `,

        className

      )}

      {...props}

    />

  );

}


export { Input };
