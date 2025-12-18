import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "./utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 [&:has(>button)]:pe-1.5 [&>button]:m-0 [&>button]:size-3.5 [&>button]:shrink-0 [&>button]:rounded-sm [&>button]:hover:bg-black/10 [&>button]:dark:hover:bg-white/10 [&>button:active]:translate-y-px [&>button:active]:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(0,0,0,0.2)] [&>button:active]:dark:shadow-[inset_0_2px_4px_rgba(255,255,255,0.15),inset_0_1px_1px_rgba(255,255,255,0.1)] [&>button>svg]:pointer-events-none [&>button>svg]:shrink-0 transition-[color,background-color,border-color,text-decoration-color,fill,stroke,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({ className, variant, asChild = false, ...props }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };