"use client";

import type { CareerYears } from "@/lib/types";

const OPTIONS: { value: CareerYears; label: string }[] = [
  { value: 0, label: "0년 (신입)" },
  { value: 1, label: "1년차" },
  { value: 2, label: "2년차" },
];

interface CareerYearsSelectProps {
  value: CareerYears | null;
  onChange: (value: CareerYears) => void;
  error?: string | null;
}

/**
 * PRD 5-2 AC: 경력은 0~2 정수 범위로만 입력 가능(그 이상 값은 UI에서 원천 차단).
 * 자유 입력 대신 버튼 선택형으로 만들어 범위 밖 값 자체가 생성되지 않도록 한다.
 */
export function CareerYearsSelect({
  value,
  onChange,
  error,
}: CareerYearsSelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
        경력
      </span>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="경력 연차">
        {OPTIONS.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.value)}
              className={`h-11 rounded-lg border px-4 text-sm font-medium transition-colors ${
                selected
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
