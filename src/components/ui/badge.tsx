import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap [&_svg]:size-3.5",
  {
    variants: {
      variant: {
        default: "bg-slate-100 text-slate-800",
        brand: "bg-brand text-white",
        normal: "bg-emerald-100 text-emerald-900",
        warning: "bg-amber-100 text-amber-900",
        elevated: "bg-rose-100 text-rose-900",
        violet: "bg-violet-100 text-violet-900",
        outline: "border border-slate-300 text-slate-700",
        dark: "bg-ink text-white",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
