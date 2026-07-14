"use client";

import { MOCK_CATEGORY_TAGS } from "@/lib/mockTags";
import type { CategorySubTag } from "@/lib/types";

interface CategoryTagPickerProps {
  value: CategorySubTag[];
  onChange: (tags: CategorySubTag[]) => void;
  error?: string | null;
}

/**
 * PRD 5-2 AC: 관심 직군 태그는 `/tags/categories` 트리에서 선택한다.
 * 원티드 API 응답은 상위 태그(직군 그룹) 아래 하위 태그(구체 직무)로 구성되어 있어
 * 실제 지원 대상 직무인 하위 태그(sub_tags) 단위로 다중 선택하게 한다.
 */
export function CategoryTagPicker({
  value,
  onChange,
  error,
}: CategoryTagPickerProps) {
  function toggle(tag: CategorySubTag) {
    const exists = value.some((t) => t.id === tag.id);
    if (exists) {
      onChange(value.filter((t) => t.id !== tag.id));
    } else {
      onChange([...value, tag]);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
        관심 직군
      </span>
      <div className="flex flex-col gap-4">
        {MOCK_CATEGORY_TAGS.map((category) => (
          <div key={category.id}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              {category.title}
            </p>
            <div className="flex flex-wrap gap-2">
              {category.sub_tags.map((subTag) => {
                const selected = value.some((t) => t.id === subTag.id);
                return (
                  <button
                    key={subTag.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggle(subTag)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                      selected
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {subTag.title}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
