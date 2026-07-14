"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import type { CategoryTag, CategorySubTag, JobWithBadges } from "@/lib/types";

// openapi.json의 `/jobs` `locations` 파라미터는 배열 문자열일 뿐 별도 enum이 없어
// 자주 쓰이는 지역명을 큐레이션한 정적 목록으로 대체한다.
const REGION_OPTIONS = ["서울", "경기", "인천", "부산", "대구", "대전", "광주", "기타"];

const PAGE_SIZE = 12;

function computeDDay(dueTime?: string): string {
  if (!dueTime) return "상시";
  const due = new Date(dueTime);
  if (Number.isNaN(due.getTime())) return "상시";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "마감";
  if (diffDays === 0) return "D-day";
  return `D-${diffDays}`;
}

function ToggleButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
        selected
          ? "border-indigo-600 bg-indigo-600 text-white"
          : "border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
      }`}
    >
      {label}
    </button>
  );
}

export default function DashboardPage() {
  const [categories, setCategories] = useState<CategoryTag[]>([]);
  const [selectedSubTags, setSelectedSubTags] = useState<CategorySubTag[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [jobs, setJobs] = useState<JobWithBadges[]>([]);
  const [hasNext, setHasNext] = useState(false);
  // entry-level 필터링 때문에 배치마다 결과 수가 달라 jobs.length를 다음 offset으로 쓸 수
  // 없다 — 서버가 알려주는 원본 목록 커서(nextOffset)를 그대로 이어받는다.
  const [nextOffset, setNextOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/tags/categories")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data.tags)) setCategories(data.tags);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    selectedSubTags.forEach((tag) => params.append("category_tags", String(tag.id)));
    selectedRegions.forEach((region) => params.append("locations", region));
    params.set("offset", "0");
    params.set("limit", String(PAGE_SIZE));

    // 필터가 바뀔 때마다 외부 API(/api/jobs)를 다시 조회해야 하므로 이펙트 시작 시점에
    // 로딩 상태로 동기화한다 (profile/page.tsx의 세션 로드와 동일한 패턴).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 필터 변경 시 새 요청 시작을 알리는 동기 상태 동기화
    setLoading(true);
    setError(null);

    fetch(`/api/jobs?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setJobs(data.jobs ?? []);
        setHasNext(Boolean(data.hasNext));
        setNextOffset(Number(data.nextOffset) || 0);
      })
      .catch(() => {
        if (!cancelled) setError("공고를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedSubTags, selectedRegions]);

  async function loadMore() {
    const params = new URLSearchParams();
    selectedSubTags.forEach((tag) => params.append("category_tags", String(tag.id)));
    selectedRegions.forEach((region) => params.append("locations", region));
    params.set("offset", String(nextOffset));
    params.set("limit", String(PAGE_SIZE));

    setLoadingMore(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      setJobs((prev) => [...prev, ...(data.jobs ?? [])]);
      setHasNext(Boolean(data.hasNext));
      setNextOffset(Number(data.nextOffset) || 0);
    } catch {
      setError("공고를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoadingMore(false);
    }
  }

  function toggleSubTag(tag: CategorySubTag) {
    setSelectedSubTags((prev) =>
      prev.some((t) => t.id === tag.id) ? prev.filter((t) => t.id !== tag.id) : [...prev, tag]
    );
  }

  function toggleRegion(region: string) {
    setSelectedRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-12 sm:py-16">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          신입 맞춤 필터 대시보드
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          최소 경력이 0년인, 진짜 신입이 지원 가능한 공고만 모아서 보여드려요.
        </p>
      </div>

      <Card className="flex flex-col gap-6">
        <div>
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">직군</span>
          <div className="mt-3 flex flex-col gap-4">
            {categories.map((category) => (
              <div key={category.id}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  {category.title}
                </p>
                <div className="flex flex-wrap gap-2">
                  {category.sub_tags.map((subTag) => (
                    <ToggleButton
                      key={subTag.id}
                      label={subTag.title}
                      selected={selectedSubTags.some((t) => t.id === subTag.id)}
                      onClick={() => toggleSubTag(subTag)}
                    />
                  ))}
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-sm text-zinc-400">직군 목록을 불러오는 중...</p>
            )}
          </div>
        </div>

        <div>
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">지역</span>
          <div className="mt-3 flex flex-wrap gap-2">
            {REGION_OPTIONS.map((region) => (
              <ToggleButton
                key={region}
                label={region}
                selected={selectedRegions.includes(region)}
                onClick={() => toggleRegion(region)}
              />
            ))}
          </div>
        </div>
      </Card>

      {loading && <p className="text-sm text-zinc-500 dark:text-zinc-400">공고를 불러오는 중...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {!loading && !error && jobs.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          조건에 맞는 공고가 없어요. 필터를 바꿔보세요.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>

      {hasNext && !loading && (
        <Button
          variant="outline"
          onClick={loadMore}
          disabled={loadingMore}
          className="mx-auto"
        >
          {loadingMore ? "불러오는 중..." : "더 보기"}
        </Button>
      )}
    </div>
  );
}

function JobCard({ job }: { job: JobWithBadges }) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <CardTitle>{job.position}</CardTitle>
          <CardDescription>{job.company.name}</CardDescription>
        </div>
        <span className="shrink-0 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          {computeDDay(job.due_time)}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {job.isTrulyEntryLevel && (
          <Badge tone="green">진짜 신입 가능 · {job.entryLevelSupportingText}</Badge>
        )}
        {job.qualificationBadges.map((badge, index) => (
          <Badge key={`${badge.category}-${index}`} tone="indigo">
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
  );
}
