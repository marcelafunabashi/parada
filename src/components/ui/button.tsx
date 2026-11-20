import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl font-semibold transition-all active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-5 [&_svg]:shrink-0 cursor-pointer select-none",
  {
    variants: {
      variant: {
        brand: "bg-brand text-white shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:brightness-105",
        dark: "bg-ink text-white hover:bg-slate-800",
        outline: "border-2 border-slate-200 bg-white text-ink hover:border-slate-300 hover:bg-mist",
        ghost: "text-ink hover:bg-slate-100",
        soft: "bg-violet-50 text-violet-800 hover:bg-violet-100",
        success: "bg-emerald-600 text-white hover:bg-emerald-700",
        danger: "bg-rose-600 text-white hover:bg-rose-700",
      },
      size: {
        sm: "min-h-11 px-3.5 text-sm",
        md: "min-h-12 px-5 text-base",
        lg: "min-h-14 px-6 text-lg",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "brand", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";
