import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  // violet-30 기준(product-designer.md 컬러 스와치): violet-20 -> violet-30 그라디언트,
  // hover 시 violet-40으로 톤을 낮춰 눌린 느낌을 준다.
  primary:
    "bg-gradient-to-r from-violet-20 to-violet-30 text-violet-90 hover:from-violet-30 hover:to-violet-40 hover:text-white disabled:from-violet-10 disabled:to-violet-20 disabled:text-violet-40",
  secondary:
    "bg-zinc-900 text-white hover:bg-zinc-700 disabled:bg-zinc-400",
  outline:
    "border border-zinc-300 text-zinc-800 hover:border-violet-30 hover:bg-violet-10 disabled:text-zinc-400 disabled:border-zinc-200 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800",
  ghost:
    "text-zinc-600 hover:bg-violet-10 hover:text-violet-70 disabled:text-zinc-300 dark:text-zinc-300 dark:hover:bg-zinc-800",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
