import { HTMLAttributes } from "react";

interface DdayBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** 마감일 (ISO 문자열 또는 Date). 원티드 API 상세 응답의 `due_time` 등에서 채운다. */
  dueDate: string | Date;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** 오늘 날짜 기준 D-day 계산 (마감일이 지났으면 음수 반환) */
function calculateDday(dueDate: string | Date): number {
  const due = startOfDay(new Date(dueDate));
  const today = startOfDay(new Date());
  const diffMs = due.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * 마감임박 D-day 뱃지 (PRD 5-7절 색상 규칙).
 *
 * - D-3 이내(D-3~D-0, 마감 당일 포함): 빨강
 * - D-7 이내(D-4~D-7): 주황
 * - 그 외(D-8 이상, 또는 마감 지남): 기본색(zinc)
 *
 * 지도 위젯(P5) 전용이 아니라 마감임박 리스트/카드 등 여러 화면에서
 * 재사용될 것을 전제로 공용 컴포넌트로 분리한다.
 */
export function DdayBadge({ dueDate, className = "", ...props }: DdayBadgeProps) {
  const dday = calculateDday(dueDate);

  const label = dday < 0 ? "마감" : dday === 0 ? "D-Day" : `D-${dday}`;

  const toneClass =
    dday >= 0 && dday <= 3
      ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
      : dday >= 4 && dday <= 7
        ? "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${toneClass} ${className}`}
      {...props}
    >
      {label}
    </span>
  );
}
