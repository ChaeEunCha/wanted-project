"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { DdayBadge } from "@/components/ui/DdayBadge";
import {
  listApplications,
  removeApplication,
  updateApplicationStatus,
} from "@/lib/applicationsStore";
import { getSessionUser } from "@/lib/authStore";
import {
  APPLICATION_STATUSES,
  APPLICATION_STATUS_LABELS,
  type Application,
  type ApplicationStatus,
} from "@/lib/types";

/**
 * 지원 여정 칸반보드 (PRD 5-5절, P3).
 *
 * - 관심 → 준비중 → 지원함 → 결과대기 4단계 컬럼. 카드 이동은 버튼으로 처리한다
 *   (AC상 "드래그 또는 버튼" 중 버튼만 구현 — 이 저장소엔 드래그 라이브러리가 없어
 *   새 의존성을 추가하지 않는 선택).
 * - 카드에 표시되는 회사명/마감일/스킬태그는 추가 시점 스냅샷이라 원본 공고 최신 상태와
 *   다를 수 있음을 카드에 명시한다.
 * - 로그인 세션은 profile/page.tsx와 동일한 패턴으로 확인하고, 비로그인 시 /login으로 보낸다.
 */
export default function ApplicationsPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const sessionUser = await getSessionUser();
      if (cancelled) return;
      if (!sessionUser) {
        router.replace("/login");
        return;
      }
      setChecked(true);
      try {
        const list = await listApplications(sessionUser.id);
        if (cancelled) return;
        setApplications(list);
      } catch {
        if (!cancelled) {
          setError("지원 현황을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function moveApplication(application: Application, direction: -1 | 1) {
    const currentIndex = APPLICATION_STATUSES.indexOf(application.status);
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= APPLICATION_STATUSES.length) return;
    const nextStatus = APPLICATION_STATUSES[nextIndex];

    // 낙관적 업데이트: 실패하면 이전 목록으로 되돌린다.
    const previous = applications;
    setApplications((prev) =>
      prev.map((item) => (item.id === application.id ? { ...item, status: nextStatus } : item))
    );

    const result = await updateApplicationStatus(application.id, nextStatus);
    if (!result.ok) {
      setApplications(previous);
      setError(result.error);
    }
  }

  async function handleRemove(application: Application) {
    const previous = applications;
    setApplications((prev) => prev.filter((item) => item.id !== application.id));

    const result = await removeApplication(application.id);
    if (!result.ok) {
      setApplications(previous);
      setError(result.error);
    }
  }

  if (!checked && loading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center px-4 py-16">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">확인 중...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-12 sm:py-16">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          지원 여정 칸반보드
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          관심 있거나 지원한 공고를 단계별로 관리해요. 카드 정보는 추가한 시점의
          스냅샷이라 원본 공고의 최신 상태와 다를 수 있어요.
        </p>
      </div>

      {loading && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">지원 현황을 불러오는 중...</p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {APPLICATION_STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              applications={applications.filter((item) => item.status === status)}
              onMove={moveApplication}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}

      {!loading && applications.length === 0 && !error && (
        <Card className="flex flex-col items-center gap-3 text-center">
          <CardTitle>아직 담긴 공고가 없어요</CardTitle>
          <CardDescription>
            대시보드에서 관심 있는 공고를 &ldquo;칸반보드에 담기&rdquo;로 추가해보세요.
          </CardDescription>
          <Link href="/dashboard">
            <Button variant="outline">대시보드로 이동</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}

function KanbanColumn({
  status,
  applications,
  onMove,
  onRemove,
}: {
  status: ApplicationStatus;
  applications: Application[];
  onMove: (application: Application, direction: -1 | 1) => void;
  onRemove: (application: Application) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          {APPLICATION_STATUS_LABELS[status]}
        </h2>
        <span className="text-xs font-medium text-zinc-400">{applications.length}</span>
      </div>

      <div className="flex flex-col gap-3">
        {applications.map((application) => (
          <ApplicationCard
            key={application.id}
            application={application}
            onMove={onMove}
            onRemove={onRemove}
          />
        ))}
        {applications.length === 0 && (
          <p className="rounded-2xl border border-dashed border-zinc-200 px-4 py-6 text-center text-xs text-zinc-400 dark:border-zinc-700">
            비어 있어요
          </p>
        )}
      </div>
    </div>
  );
}

function ApplicationCard({
  application,
  onMove,
  onRemove,
}: {
  application: Application;
  onMove: (application: Application, direction: -1 | 1) => void;
  onRemove: (application: Application) => void;
}) {
  const currentIndex = APPLICATION_STATUSES.indexOf(application.status);
  const canMovePrev = currentIndex > 0;
  const canMoveNext = currentIndex < APPLICATION_STATUSES.length - 1;

  return (
    <Card className="flex flex-col gap-2.5 p-4 sm:p-4">
      <div>
        <CardTitle className="text-sm">{application.companyName}</CardTitle>
        {application.dueTime ? (
          <DdayBadge dueDate={application.dueTime} className="mt-1.5" />
        ) : (
          <span className="mt-1.5 inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            상시
          </span>
        )}
      </div>

      {application.skillTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {application.skillTags.map((tag) => (
            <Badge key={tag.id} tone="zinc" className="text-[11px]">
              {tag.text}
            </Badge>
          ))}
        </div>
      )}

      <a
        href={application.jobUrl}
        target="_blank"
        rel="noreferrer"
        className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
      >
        원티드에서 공고 보기 →
      </a>

      <div className="mt-1 flex items-center justify-between">
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={!canMovePrev}
            onClick={() => onMove(application, -1)}
          >
            ← 이전
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={!canMoveNext}
            onClick={() => onMove(application, 1)}
          >
            다음 →
          </Button>
        </div>
        <button
          type="button"
          onClick={() => onRemove(application)}
          className="text-xs text-zinc-400 hover:text-red-500"
        >
          삭제
        </button>
      </div>
    </Card>
  );
}
