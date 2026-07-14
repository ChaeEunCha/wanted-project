import { ButtonHTMLAttributes } from "react";

interface FilterChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected: boolean;
  label: string;
}

/**
 * 클릭해서 켜고 끄는 토글형 필터 칩 (PRD 5절 P0-신입 맞춤 필터 대시보드에서
 * 직군/지역 조합 필터 UI로 사용 예정).
 *
 * - 선택됨: violet-30 배경(브랜드 포인트 색으로 눈에 띄게)
 * - 선택 안 됨: violet-10 배경(옅은 파스텔로 은은하게)
 */
export function FilterChip({
  selected,
  label,
  className = "",
  ...props
}: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
        selected
          ? "bg-violet-30 text-violet-90"
          : "bg-violet-10 text-violet-60 hover:bg-violet-20"
      } ${className}`}
      {...props}
    >
      {label}
    </button>
  );
}
