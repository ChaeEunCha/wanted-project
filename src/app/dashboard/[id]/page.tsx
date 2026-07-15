"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { DdayBadge } from "@/components/ui/DdayBadge";
import { EntryFriendlyBadge } from "@/components/ui/EntryFriendlyBadge";
import type { JobDetailWithInsight } from "@/lib/types";

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = use(params);
  const [job, setJob] = useState<JobDetailWithInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // id가 바뀔 때마다 새 요청 시작을 알리는 동기 상태 동기화 (dashboard/page.tsx와 동일 패턴)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);

    fetch(`/api/jobs/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setJob(data);
      })
      .catch(() => {
        if (!cancelled) setError("공고 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="mx-auto flex w-full flex-1 flex-col gap-6 px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
      <Link
        href="/dashboard"
        className="text-sm font-medium text-zinc-500 hover:underline dark:text-zinc-400"
      >
        ← 대시보드로 돌아가기
      </Link>

      {loading && <p className="text-sm text-zinc-500 dark:text-zinc-400">불러오는 중...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!loading && !error && job && (
        <>
          <Card className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>{job.position}</CardTitle>
                <CardDescription>{job.company.name}</CardDescription>
              </div>
              {job.due_time ? (
                <DdayBadge dueDate={job.due_time} className="shrink-0" />
              ) : (
                <span className="shrink-0 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  상시
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {job.isTrulyEntryLevel && (
                <>
                  <EntryFriendlyBadge />
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {job.entryLevelSupportingText}
                  </span>
                </>
              )}
              {job.qualificationBadges.map((badge, index) => (
                <Badge key={`${badge.category}-${index}`} tone="violet">
                  {badge.label}
                </Badge>
              ))}
            </div>

            {job.otherLines.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-zinc-400">기타 자격요건</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-zinc-500 dark:text-zinc-400">
                  {job.otherLines.map((line, index) => (
                    <li key={index}>{line}</li>
                  ))}
                </ul>
              </div>
            )}

            <a
              href={job.url}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              원티드에서 공고 보기 →
            </a>
          </Card>

          {job.hasRegistrationNumber && (
            <Card className="flex flex-col gap-2">
              <CardTitle>회사 정보</CardTitle>
              {job.companyInsight ? (
                <div className="flex flex-col gap-1">
                  {job.companyInsight.averageSalary !== undefined && (
                    <p className="text-sm text-zinc-700 dark:text-zinc-200">
                      평균연봉 {job.companyInsight.averageSalary.toLocaleString("ko-KR")}원
                    </p>
                  )}
                  {job.companyInsight.hiredSalary !== undefined && (
                    <p className="text-sm text-zinc-700 dark:text-zinc-200">
                      신규입사자 평균연봉{" "}
                      {job.companyInsight.hiredSalary.toLocaleString("ko-KR")}원
                    </p>
                  )}
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
                    {job.companyInsight.employeeCountNPS !== undefined && (
                      <span>재직자 수(국민연금) {job.companyInsight.employeeCountNPS}명</span>
                    )}
                    {job.companyInsight.employeeCountEI !== undefined && (
                      <span>재직자 수(고용보험) {job.companyInsight.employeeCountEI}명</span>
                    )}
                    {job.companyInsight.hireRate !== undefined && (
                      <span>입사율 {job.companyInsight.hireRate}%</span>
                    )}
                    {job.companyInsight.leftRate !== undefined && (
                      <span>퇴사율 {job.companyInsight.leftRate}%</span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  회사 재무 정보 준비중
                </p>
              )}
            </Card>
          )}

          {job.benefits && (
            <Card className="flex flex-col gap-2">
              <CardTitle>복지</CardTitle>
              <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-200">
                {job.benefits}
              </p>
            </Card>
          )}

          {job.attractionTags.length > 0 && (
            <Card className="flex flex-col gap-2">
              <CardTitle>매력 태그</CardTitle>
              <div className="flex flex-wrap gap-2">
                {job.attractionTags.map((tag) => (
                  <Badge key={tag.id} tone="violet">
                    {tag.text}
                  </Badge>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
