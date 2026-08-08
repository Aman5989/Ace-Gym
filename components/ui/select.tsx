"use client"

import * as React from "react"

import { Select as SelectPrimitive } from "@base-ui/react/select"

import { cn } from "@/lib/utils"

import {
  ChevronDownIcon,
  ChevronUpIcon,
  CheckIcon,
} from "lucide-react"


const Select = SelectPrimitive.Root



function SelectGroup({
  className,
  ...props
}: SelectPrimitive.Group.Props) {

  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn(
        "scroll-my-1 p-1",
        className
      )}
      {...props}
    />
  )

}





function SelectValue({
  className,
  ...props
}: SelectPrimitive.Value.Props) {

  return (

    <SelectPrimitive.Value

      data-slot="select-value"

      className={cn(
        `
        flex
        flex-1
        min-w-0
        items-center
        truncate
        font-medium
        text-left
        text-slate-900
        `,
        className
      )}

      {...props}

    />

  )

}







function SelectTrigger({

  className,

  size = "default",

  children,

  ...props

}: SelectPrimitive.Trigger.Props & {
  size?: "sm" | "default"

}) {

  return (

    <SelectPrimitive.Trigger

      type="button"

      data-slot="select-trigger"

      data-size={size}

      className={cn(

        `
        flex

        min-h-12

        min-w-30


        w-full

        items-center

        justify-between

        gap-2


        rounded-xl


        border

        border-slate-200


        bg-white


        px-4


        text-sm

        text-slate-900


        shadow-sm


        outline-none


        transition



        focus:border-blue-500


        focus:ring-4

        focus:ring-blue-500/10



        disabled:cursor-not-allowed


        disabled:opacity-50



        data-placeholder:text-slate-400



        [&_svg]:

        size-5



        [&_svg]:

        text-slate-500

        `,

        className

      )}

      {...props}

    >


      {children}



      <SelectPrimitive.Icon

        render={

          <ChevronDownIcon />

        }

      />



    </SelectPrimitive.Trigger>

  )

}









function SelectContent({

  className,

  children,

  side = "bottom",

  sideOffset = 4,

  align = "center",

  alignOffset = 0,

  alignItemWithTrigger = true,

  ...props

}: SelectPrimitive.Popup.Props &

Pick<

SelectPrimitive.Positioner.Props,

"align" |

"alignOffset" |

"side" |

"sideOffset" |

"alignItemWithTrigger"

>) {


  return (

    <SelectPrimitive.Portal>


      <SelectPrimitive.Positioner

        side={side}

        sideOffset={sideOffset}

        align={align}

        alignOffset={alignOffset}

        alignItemWithTrigger={alignItemWithTrigger}

        className="isolate z-50"

      >


        <SelectPrimitive.Popup

          data-slot="select-content"

          className={cn(

            `
            max-h-(--available-height)


            w-(--anchor-width)

            min-w-56


            overflow-x-hidden
            overflow-y-auto


            rounded-xl


            bg-white


            text-slate-900


            shadow-xl


            ring-1


            ring-slate-200


            p-1

            `,

            className

          )}

          {...props}

        >



          <SelectScrollUpButton />



          <SelectPrimitive.List>


            {children}


          </SelectPrimitive.List>




          <SelectScrollDownButton />



        </SelectPrimitive.Popup>



      </SelectPrimitive.Positioner>


    </SelectPrimitive.Portal>

  )

}









function SelectLabel({

  className,

  ...props

}: SelectPrimitive.GroupLabel.Props) {


  return (

    <SelectPrimitive.GroupLabel


      data-slot="select-label"


      className={cn(

        `
        px-3

        py-2

        text-xs

        font-medium

        text-slate-500

        `,

        className

      )}

      {...props}


    />

  )

}









function SelectItem({

  className,

  children,

  ...props

}: SelectPrimitive.Item.Props) {


  return (

    <SelectPrimitive.Item


      data-slot="select-item"


      className={cn(

        `
        relative

        flex

        w-full

        cursor-default

        items-center


        rounded-lg


        px-3


        min-h-11

        py-3


        text-base


        text-slate-700



        outline-none



        select-none




        focus:bg-blue-50



        focus:text-blue-700




        data-disabled:pointer-events-none



        data-disabled:opacity-50

        `,

        className

      )}



      {...props}



    >




      <SelectPrimitive.ItemText

        className="flex-1"

      >

        {children}

      </SelectPrimitive.ItemText>





      <SelectPrimitive.ItemIndicator


        render={

          <span

            className="
            absolute
            right-3
            flex
            size-4
            items-center
            justify-center
            "

          />

        }


      >

        <CheckIcon

          className="
          size-4
          text-blue-600
          "

        />


      </SelectPrimitive.ItemIndicator>



    </SelectPrimitive.Item>


  )

}








function SelectSeparator({

  className,

  ...props

}: SelectPrimitive.Separator.Props) {


  return (

    <SelectPrimitive.Separator


      data-slot="select-separator"


      className={cn(

        `
        my-1

        h-px

        bg-slate-100

        `,

        className

      )}

      {...props}


    />


  )

}








function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(
        "flex justify-center bg-white py-1",
        className
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpArrow>
  );
}









function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(
        "flex justify-center bg-white py-1",
        className
      )}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownArrow>
  );
}







export {

  Select,

  SelectContent,

  SelectGroup,

  SelectItem,

  SelectLabel,

  SelectScrollDownButton,

  SelectScrollUpButton,

  SelectSeparator,

  SelectTrigger,

  SelectValue,

}
