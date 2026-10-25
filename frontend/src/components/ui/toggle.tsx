"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Toggle as TogglePrimitive } from "radix-ui"

const toggleVariants = cva(
  "group/toggle inline-flex items-center justify-center gap-1 text-sm font-medium whitespace-nowrap transition-[color,background-color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "rounded-md bg-transparent hover:bg-muted disabled:opacity-50 data-[state=on]:bg-rail data-[state=on]:font-bold data-[state=on]:text-rail-foreground dark:data-[state=on]:bg-rail-hi",
        outline:
          "rounded-md border border-input bg-transparent hover:bg-muted disabled:opacity-50 data-[state=on]:border-piping data-[state=on]:bg-rail data-[state=on]:font-bold data-[state=on]:text-rail-foreground dark:data-[state=on]:bg-rail-hi",
        // A round chip: ivory when free, clay with its inlay when set down. Dashed rings mean lost lives, never choices.
        chip:
          "rounded-full border-[3px] border-chip-rim bg-paper font-bold text-ink shadow-[0_3px_6px_-2px_rgba(0,0,0,.5)] hover:-translate-y-0.5 disabled:bg-rail disabled:border-solid disabled:border-piping disabled:text-rail-muted disabled:line-through disabled:shadow-none data-[state=on]:border-chip-inlay data-[state=on]:bg-chip data-[state=on]:text-chip-inlay data-[state=on]:shadow-[0_0_0_3px_var(--brass),0_4px_8px_-2px_rgba(0,0,0,.5)]",
      },
      size: {
        default:
          "h-11 min-w-11 px-3 text-base has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        sm: "h-8 min-w-8 px-2.5 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
        lg: "h-10 min-w-10 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        chip: "size-12 text-xl",
        chipSm: "size-10 shrink-0 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Toggle({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
