import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * estaila button system — personality-led variants.
 *
 * Defaults rebalanced toward warm + rounded:
 *   - All variants get hover-scale 1.02 / active 0.97 micro-motion
 *   - `default` = warm primary (terracotta) — main calls to action
 *   - `ink` = inverted dark pill (Arto+ style) — premium "Create / Save" actions
 *   - `pill` = subtle outline rounded-full — secondary navigation/filters
 *   - `soft` = warm secondary chip — tertiary actions
 *   - `outline` / `ghost` / `secondary` / `destructive` / `link` — existing semantics, refined
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl text-sm font-medium whitespace-nowrap outline-none transition-[background-color,border-color,box-shadow,color,opacity] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:[transform:scale(0.98)] [transition-property:background-color,border-color,box-shadow,color,opacity,transform] aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Default: clean warm primary — no shadow glow that competes with content
        default:
          "bg-primary text-primary-foreground hover:bg-primary/92",
        // Ink: refined black pill — subtle press only
        ink:
          "bg-ink text-ink-foreground hover:bg-ink/90",
        // Pill: light outline rounded-full for filters / secondary nav
        pill:
          "rounded-full border border-border bg-card hover:border-foreground/30 hover:bg-secondary/60",
        // Soft: warm chip secondary
        soft:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/92",
        outline:
          "border border-border bg-background hover:border-foreground/30 hover:bg-secondary/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-secondary hover:text-foreground",
        link:
          "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-lg px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-lg px-3 has-[>svg]:px-2.5",
        lg: "h-11 rounded-2xl px-6 has-[>svg]:px-4 text-[15px]",
        xl: "h-12 rounded-2xl px-7 text-[15px] [&_svg:not([class*='size-'])]:size-[18px]",
        icon: "size-9 rounded-xl",
        "icon-xs": "size-6 rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-lg",
        "icon-lg": "size-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
