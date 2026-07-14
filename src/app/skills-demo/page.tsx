"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { DdayBadge } from "@/components/ui/DdayBadge";
import { EntryFriendlyBadge } from "@/components/ui/EntryFriendlyBadge";
import { FilterChip } from "@/components/ui/FilterChip";
import { SkillTagList } from "@/components/ui/SkillTagWithTooltip";
import { MOCK_JOB_POSTINGS } from "@/lib/mockJobs";

const DEMO_FILTERS = ["프론트엔드", "백엔드", "디자인", "서울"];

/**
 * 용어 툴팁(P2) 데모 페이지.
 *
 * 아직 P0-신입 맞춤 필터 대시보드(`/jobs` 목록/상세)가 구현되어 있지 않아,
 * skill_tags/EntryFriendlyBadge/DdayBadge/FilterChip이 실제로 쓰이는 화면 맥락
 * (공고 카드)을 보여주기 위한 임시 데모다. 실제 `/jobs` 화면이 만들어지면
 * 이 페이지의 렌더링 부분을 그대로 옮겨서 재사용하면 된다.
 */
export default function SkillsDemoPage() {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  function toggleFilter(filter: string) {
    setActiveFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-12">
      <div>
        <p className="text-sm font-medium text-violet-50">
          P2 · 용어 툴팁 데모
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
          기술 스택 태그, 몰라도 괜찮아요
        </h1>
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          스킬 태그에 물음표(?)가 붙어 있으면 자체 제작한 용어 설명이 있다는
          뜻이에요. PC에서는 마우스를 올리면, 모바일에서는 태그를 탭하면
          설명이 떠요. 설명이 아직 준비 안 된 태그는 물음표 없이 뱃지만
          보여줘요.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {DEMO_FILTERS.map((filter) => (
          <FilterChip
            key={filter}
            label={filter}
            selected={activeFilters.includes(filter)}
            onClick={() => toggleFilter(filter)}
          />
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {MOCK_JOB_POSTINGS.map((job) => (
          <Card key={job.id} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <CardTitle>{job.position}</CardTitle>
                <CardDescription className="mt-0.5">
                  {job.companyName} · {job.location}
                </CardDescription>
              </div>
              {job.isEntryFriendly ? (
                <EntryFriendlyBadge />
              ) : (
                <Badge tone="zinc">경력 우대 포함</Badge>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
              <DdayBadge dueDate={job.dueDate} />
              마감 {job.dueDate}
            </div>

            <SkillTagList skills={job.skillTags} />
          </Card>
        ))}
      </div>

      <Card className="border-dashed bg-violet-10/60 text-sm text-violet-70">
        <p className="font-medium">용어 사전 커버리지 안내</p>
        <p className="mt-1 text-violet-60">
          사전(`src/lib/termGlossary.ts`)은 skill_tag_id 기준으로 매핑되어
          있고, 아직 설명이 없는 스킬 태그는 의도적으로 툴팁 없이 뱃지만
          노출돼요(PRD 5-4 AC). 신입 공고에 자주 등장하는 스킬부터 우선
          채워나갈 예정이에요.
        </p>
      </Card>
    </div>
  );
}
