"use client";

import { useId, useState } from "react";
import type { SkillTag } from "@/lib/types";
import { getTermDescription } from "@/lib/termGlossary";

interface SkillTagWithTooltipProps {
  skill: SkillTag;
  className?: string;
}

/**
 * 공고의 스킬 태그 하나를 뱃지로 보여주는 컴포넌트 (PRD.md 5-4절 "용어 툴팁").
 *
 * - `termGlossary`(skill_tag_id 기준)에 설명이 있으면 PC에서는 hover, 모바일에서는
 *   tap 시 설명 툴팁을 띄운다.
 * - 설명이 없는 스킬은 툴팁 UI/인터랙션 없이 뱃지만 노출한다(AC: "사전에 없는
 *   태그는 툴팁 미노출" — 빈 툴팁을 만들지 않고 아예 생략).
 * - 스타일은 이번 기능 전용으로 새로 도입한 violet 팔레트(product-designer.md 기준,
 *   violet-30 = #B497F5)를 사용한다. 기존 `Badge`(indigo 톤) 등 다른 컴포넌트/사용처는
 *   그대로 두고 건드리지 않는다.
 */
export function SkillTagWithTooltip({ skill, className = "" }: SkillTagWithTooltipProps) {
  const description = getTermDescription(skill.id);
  const tooltipId = useId();
  const [open, setOpen] = useState(false);

  // 사전에 설명이 없는 스킬: 인터랙션 없는 일반 뱃지만 렌더링
  if (!description) {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-violet-10 px-3 py-1 text-xs font-medium text-violet-60 ${className}`}
      >
        {skill.title}
      </span>
    );
  }

  return (
    <span className={`relative inline-block ${className}`}>
      <button
        type="button"
        aria-describedby={open ? tooltipId : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex cursor-help items-center gap-1 rounded-full bg-gradient-to-r from-violet-20 to-violet-30/70 px-3 py-1 text-xs font-semibold text-violet-70 ring-1 ring-inset ring-violet-30/40 transition-transform active:scale-95"
      >
        {skill.title}
        <span
          aria-hidden
          className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-violet-30 text-[9px] font-bold leading-none text-white"
        >
          ?
        </span>
      </button>

      {open && (
        <span
          id={tooltipId}
          role="tooltip"
          className="absolute left-1/2 top-full z-20 mt-2 w-56 -translate-x-1/2 rounded-xl bg-violet-80 px-3 py-2 text-xs leading-relaxed text-white shadow-lg"
        >
          <span
            aria-hidden
            className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-violet-80"
          />
          {description}
        </span>
      )}
    </span>
  );
}

interface SkillTagListProps {
  skills: SkillTag[];
  className?: string;
}

/** 스킬 태그 배열을 한 줄에 wrap되게 나열하는 헬퍼 (공고 카드 등에서 재사용) */
export function SkillTagList({ skills, className = "" }: SkillTagListProps) {
  if (skills.length === 0) return null;
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {skills.map((skill) => (
        <SkillTagWithTooltip key={skill.id} skill={skill} />
      ))}
    </div>
  );
}
