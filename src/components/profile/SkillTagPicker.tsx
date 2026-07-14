"use client";

import { useState } from "react";
import { RemovableBadge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { searchMockSkillTags } from "@/lib/mockTags";
import type { SkillTag } from "@/lib/types";

interface SkillTagPickerProps {
  value: SkillTag[];
  onChange: (tags: SkillTag[]) => void;
  error?: string | null;
}

/**
 * PRD 5-2 AC: 관심 스킬 태그는 자유 텍스트가 아니라 `/tags/skills` 자동완성 결과에서 선택해
 * skill_tag_id 기준으로 저장한다 (제목 문자열 매칭 금지 — P4 매칭 로직 정확도를 위해).
 * v1에서는 mockTags.searchMockSkillTags로 자동완성을 흉내낸다.
 */
export function SkillTagPicker({ value, onChange, error }: SkillTagPickerProps) {
  const [keyword, setKeyword] = useState("");
  const suggestions = searchMockSkillTags(keyword).filter(
    (tag) => !value.some((selected) => selected.id === tag.id)
  );

  function addTag(tag: SkillTag) {
    onChange([...value, tag]);
    setKeyword("");
  }

  function removeTag(id: number) {
    onChange(value.filter((tag) => tag.id !== id));
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor="skill-tag-search"
        className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
      >
        관심 스킬 태그
      </label>
      <div className="relative">
        <Input
          id="skill-tag-search"
          placeholder="예: React, Figma... 검색 후 목록에서 선택하세요"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          autoComplete="off"
        />
        {suggestions.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-md dark:border-zinc-700 dark:bg-zinc-900">
            {suggestions.map((tag) => (
              <li key={tag.id}>
                <button
                  type="button"
                  onClick={() => addTag(tag)}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  {tag.title}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {value.map((tag) => (
            <RemovableBadge
              key={tag.id}
              label={tag.title}
              onClick={() => removeTag(tag.id)}
              aria-label={`${tag.title} 제거`}
            />
          ))}
        </div>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        검색 결과 목록에서 선택한 태그만 등록돼요 (직접 입력한 텍스트는 저장되지 않아요).
      </p>
    </div>
  );
}
