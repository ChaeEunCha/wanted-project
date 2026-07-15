"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { computeMatchDiagnosis } from "@/lib/matching";
import { listCheckedSkillTagIds, setGapChecklistItem } from "@/lib/gapChecklistStore";
import type { JobWithBadges, UserProfile } from "@/lib/types";
import { Badge } from "./Badge";

/**
 * JD 매칭 진단 & 이력서 갭 체크리스트(P4, PRD 5-6).
 *
 * - 매칭률은 skill_tags(구조화 데이터)만으로 계산하고, preferred_points는 매칭률에
 *   포함하지 않고 참고용 원문 텍스트로만 노출한다(PRD 5-6).
 * - 공고에 skill_tags가 없으면 계산할 대상이 없으므로 섹션 자체를 숨긴다.
 * - 로그인하지 않았거나 프로필에 스킬 태그가 하나도 없으면, 매칭률 대신
 *   프로필을 채우도록 유도하는 문구를 노출한다(AC).
 */
export function MatchDiagnosis({
  job,
  profile,
  userId,
}: {
  job: JobWithBadges;
  profile: UserProfile | null;
  userId: string | null;
}) {
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());

  const jobSkillTags = job.skill_tags ?? [];

  useEffect(() => {
    if (!userId || jobSkillTags.length === 0) return;
    let cancelled = false;
    listCheckedSkillTagIds(userId, job.id).then((ids) => {
      if (!cancelled) setCheckedIds(ids);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- jobSkillTags는 job.id마다 고정된 값이라 job.id만으로 충분하다
  }, [userId, job.id]);

  if (jobSkillTags.length === 0) return null;

  if (!userId) return null;

  if (!profile || profile.skillTags.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-violet-30 bg-violet-10 px-4 py-3 text-sm text-violet-70 dark:bg-violet-80/20 dark:text-violet-20">
        <p className="font-medium">매칭률을 보려면 프로필에 스킬 태그를 등록해주세요.</p>
        <Link href="/profile" className="mt-1 inline-block underline">
          프로필 채우러 가기 →
        </Link>
      </div>
    );
  }

  const { matchRate, gapTags } = computeMatchDiagnosis(profile.skillTags, jobSkillTags);
  const matchPercent = Math.round(matchRate * 100);

  async function handleToggle(skillTagId: number, nextChecked: boolean) {
    if (!userId) return;
    const previous = new Set(checkedIds);
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (nextChecked) next.add(skillTagId);
      else next.delete(skillTagId);
      return next;
    });
    const result = await setGapChecklistItem(userId, job.id, skillTagId, nextChecked);
    if (!result.ok) setCheckedIds(previous);
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-700">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">JD 매칭 진단</p>
        <Badge tone={matchPercent >= 50 ? "green" : "violet"}>매칭률 {matchPercent}%</Badge>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-20 to-violet-30"
          style={{ width: `${matchPercent}%` }}
        />
      </div>

      {gapTags.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-zinc-400">
            이 스킬 채우면 매칭률 올라요
          </p>
          {/* 실 API에서 skill_tags[].id가 null -> 0으로 내려오는 공고가 많아(wanted/client.ts
              normalizeTag 참고) 한 공고 안에 id=0인 태그가 여러 개 섞일 수 있다. index를 key/DOM id에
              섞어 렌더링 충돌은 막았지만, 체크 상태 자체는 여전히 skill_tag_id 기준이라 id=0인
              태그끼리는 체크가 서로 연동된다 — 근본 해결은 실제 skill_tag_id 정합성 문제(더 큰 작업)에 달려있다. */}
          <ul className="mt-1.5 flex flex-col gap-1.5">
            {gapTags.map((tag, index) => (
              <li key={`${tag.id}-${index}`} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`gap-${job.id}-${tag.id}-${index}`}
                  checked={checkedIds.has(tag.id)}
                  onChange={(event) => handleToggle(tag.id, event.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-violet-40 focus:ring-violet-30"
                />
                <label
                  htmlFor={`gap-${job.id}-${tag.id}-${index}`}
                  className={`text-sm ${
                    checkedIds.has(tag.id)
                      ? "text-zinc-400 line-through"
                      : "text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {tag.text}
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      {job.preferredPoints && (
        <div>
          <p className="text-xs font-semibold text-zinc-400">
            우대사항 (매칭률에는 반영되지 않아요, 참고용)
          </p>
          <p className="mt-1 whitespace-pre-line text-sm text-zinc-500 dark:text-zinc-400">
            {job.preferredPoints}
          </p>
        </div>
      )}
    </div>
  );
}

