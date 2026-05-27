import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#C8E874] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-[#C8E874] text-[#1A1C1D]",
        secondary:
          "bg-[#ECF2F5] text-[#616467]",
        destructive:
          "bg-[#EF4444] text-white",
        outline: "border border-[#E5E7EB] text-[#616467]",
        success:
          "bg-[#C8E874] text-[#1A1C1D]",
        warning:
          "bg-[#FEF3C7] text-[#92400E]",
        purple:
          "bg-[#C8B3EC] text-[#1A1C1D]",
        dark:
          "bg-[#2D3134] text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
