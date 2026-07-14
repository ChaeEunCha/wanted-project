import { ButtonHTMLAttributes, HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "violet" | "zinc" | "green";
}

const TONE_CLASSES: Record<NonNullable<BadgeProps["tone"]>, string> = {
  // violet-10/violet-60 (product-designer.md 컬러 스와치 기준)
  violet: "bg-violet-10 text-violet-60 dark:bg-violet-80/40 dark:text-violet-20",
  zinc: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  green:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
};

export function Badge({ tone = "violet", className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${TONE_CLASSES[tone]} ${className}`}
      {...props}
    />
  );
}

interface RemovableBadgeProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: BadgeProps["tone"];
  label: string;
}

/** 선택된 태그 등을 X 버튼과 함께 보여주는 뱃지 (버튼 형태) */
export function RemovableBadge({
  tone = "violet",
  label,
  className = "",
  ...props
}: RemovableBadgeProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${TONE_CLASSES[tone]} ${className}`}
      {...props}
    >
      {label}
      <span aria-hidden className="text-sm leading-none">
        ×
      </span>
    </button>
  );
}
