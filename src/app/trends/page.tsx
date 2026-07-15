"use client";

import { useEffect, useState } from "react";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";

interface TrendSkill {
  skill_tag_id: number;
  skill_tag_title: string;
  rank: number;
  count: number;
}

function SkillBarRow({ skill, maxCount }: { skill: TrendSkill; maxCount: number }) {
  const widthPercent = maxCount > 0 ? Math.max((skill.count / maxCount) * 100, 4) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-6 shrink-0 text-right text-xs font-semibold text-zinc-400">
        {skill.rank}
      </span>
      <span className="w-28 shrink-0 truncate text-sm text-zinc-700 dark:text-zinc-200">
        {skill.skill_tag_title}
      </span>
      <div className="flex flex-1 items-center gap-2">
        <div className="h-6 flex-1 rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-6 rounded-full bg-violet-30"
            style={{ width: `${widthPercent}%` }}
          />
        </div>
        <span className="w-8 shrink-0 text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
          {skill.count}
        </span>
      </div>
    </div>
  );
}

export default function TrendsPage() {
  const [skills, setSkills] = useState<TrendSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/trends/skills")
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setSkills(data.skills ?? []);
      })
      .catch(() => {
        if (!cancelled) setError("트렌드 데이터를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const maxCount = skills.reduce((max, skill) => Math.max(max, skill.count), 0);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-12 sm:py-16">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          신입 채용 트렌드 인사이트
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          진짜 신입 가능 공고를 대상으로 가장 많이 요구되는 스킬 TOP10이에요.
        </p>
      </div>

      <Card className="flex flex-col gap-4">
        <div>
          <CardTitle>스킬 요구 빈도 TOP10</CardTitle>
          <CardDescription>표본 공고 기준 집계 결과이며 매일 갱신돼요.</CardDescription>
        </div>

        {loading && <p className="text-sm text-zinc-500 dark:text-zinc-400">불러오는 중...</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {!loading && !error && skills.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            집계할 데이터가 아직 없어요.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {skills.map((skill) => (
            <SkillBarRow key={skill.skill_tag_id || skill.skill_tag_title} skill={skill} maxCount={maxCount} />
          ))}
        </div>
      </Card>
    </div>
  );
}
