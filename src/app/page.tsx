"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { JobCardPreview } from "@/components/JobCardPreview";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { DdayBadge } from "@/components/ui/DdayBadge";
import { ProfileCompletionBanner } from "@/components/ui/ProfileCompletionBanner";
import { listApplications } from "@/lib/applicationsStore";
import { getProfile, getSessionUser } from "@/lib/authStore";
import {
  APPLICATION_STATUSES,
  APPLICATION_STATUS_LABELS,
  type Application,
  type JobWithBadges,
  type UserProfile,
} from "@/lib/types";

const DASHBOARD_PREVIEW_LIMIT = 4;
const DEADLINE_SOON_DAYS = 3;
const TREND_PREVIEW_LIMIT = 3;
const SKILL_TAG_NUDGE_THRESHOLD = 3;

type HomeState =
  | { kind: "loading" }
  | { kind: "guest" }
  | { kind: "incomplete"; profile: UserProfile }
  | { kind: "complete"; userId: string; email: string | null; profile: UserProfile };

function isDueWithinDays(dueTime: string | undefined, days: number): boolean {
  if (!dueTime) return false;
  const diffDays = Math.round((new Date(dueTime).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= days;
}

function isProfileComplete(profile: UserProfile): boolean {
  return (
    profile.careerYears !== null &&
    profile.categoryTags.length > 0 &&
    profile.skillTags.length > 0 &&
    profile.portfolios.length > 0
  );
}

export default function Home() {
  const [state, setState] = useState<HomeState>({ kind: "loading" });

  useEffect(() => {
    // 로그인 세션/프로필 조회는 Supabase 비동기 호출이라 마운트 이후에만 알 수 있다
    // (profile/page.tsx와 동일한 패턴).
    let cancelled = false;

    async function load() {
      try {
        const sessionUser = await getSessionUser();
        if (cancelled) return;
        if (!sessionUser) {
          setState({ kind: "guest" });
          return;
        }

        const profile = await getProfile(sessionUser.id);
        if (cancelled) return;

        if (isProfileComplete(profile)) {
          setState({ kind: "complete", userId: sessionUser.id, email: sessionUser.email, profile });
        } else {
          setState({ kind: "incomplete", profile });
        }
      } catch {
        // 세션/프로필 조회 실패(예: Supabase 미설정, 네트워크 오류) 시에도 화면이
        // "확인 중..."에 영구히 멈추지 않도록 비로그인 상태로 폴백한다.
        if (!cancelled) setState({ kind: "guest" });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === "loading") {
    return (
      <div className="mx-auto flex w-full flex-1 items-center justify-center px-4 sm:px-6 lg:px-10 py-16">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">확인 중...</p>
      </div>
    );
  }

  if (state.kind === "incomplete") {
    return (
      <div className="mx-auto flex w-full flex-1 flex-col gap-6 px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
        <ProfileCompletionBanner profile={state.profile} />
      </div>
    );
  }

  if (state.kind === "complete") {
    return <DashboardHome userId={state.userId} email={state.email} profile={state.profile} />;
  }

  return <GuestHome />;
}

function GuestHome() {
  return (
    <div className="mx-auto flex w-full flex-1 flex-col gap-10 px-4 sm:px-6 lg:px-10 py-16">
      <div className="text-center sm:text-left">
        <p className="text-sm font-medium text-violet-60">
          원티드 API 기반 신입 구직자 대시보드
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          처음 구직하는 당신을 위한{" "}
          <br className="hidden sm:block" />
          진짜 맞춤 정보만 모았어요
        </h1>
        <p className="mt-4 text-base text-zinc-500 dark:text-zinc-400">
          &ldquo;신입&rdquo; 태그 붙어놓고 경력 3년 요구하는 공고, 이제 그만
          걸러요. 가입 한 번으로 진짜 신입 가능 공고부터 지원 이력 관리까지 한
          곳에서 시작할 수 있어요.
        </p>
        <div className="mt-6 flex justify-center gap-3 sm:justify-start">
          <Link href="/signup">
            <Button>회원가입하고 시작하기</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline">로그인</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <PainPointItem
          emoji="🎯"
          title="가짜 신입 공고 거르기"
          description={
            '경력 요건을 실제로 파싱해서 "진짜 신입 가능" 공고만 뱃지로 보여줘요.'
          }
        />
        <PainPointItem
          emoji="🗂️"
          title="지원 여정 한눈에 관리"
          description="관심·준비중·지원함·결과대기, 흩어진 지원 이력을 한 보드에서 관리해요."
        />
        <PainPointItem
          emoji="💬"
          title="모르는 용어는 바로 설명"
          description="공고 속 어려운 기술 태그, 탭 한 번이면 쉬운 설명이 떠요."
        />
        <PainPointItem
          emoji="⏰"
          title="마감일 놓치지 않기"
          description="D-day 기준으로 마감 임박 공고를 먼저 보여줘서 지원 타이밍을 안 놓쳐요."
        />
      </div>

      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>회원가입 &amp; 프로필/포트폴리오</CardTitle>
          <CardDescription>
            경력, 관심 직군·스킬 태그, 포트폴리오를 등록하면 이후 매칭/추천
            기능에서 재사용돼요.
          </CardDescription>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link href="/login">
            <Button variant="outline">로그인</Button>
          </Link>
          <Link href="/signup">
            <Button>회원가입</Button>
          </Link>
        </div>
      </Card>

      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>용어 툴팁 데모 (P2)</CardTitle>
          <CardDescription>
            공고 속 기술 스택 태그에 마우스를 올리거나(PC) 탭하면(모바일) 쉬운
            설명이 떠요. 아직 공고 목록/상세 화면이 없어 목업 공고 카드로
            미리 보여드려요.
          </CardDescription>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link href="/skills-demo">
            <Button variant="outline">데모 보러가기</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

function PainPointItem({
  emoji,
  title,
  description,
}: {
  emoji: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-3xl bg-violet-10 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-lg dark:bg-zinc-900">
        <span aria-hidden>{emoji}</span>
      </div>
      <div>
        <p className="text-sm font-semibold text-violet-70">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      </div>
    </div>
  );
}

function DashboardHome({
  userId,
  email,
  profile,
}: {
  userId: string;
  email: string | null;
  profile: UserProfile;
}) {
  const [jobs, setJobs] = useState<JobWithBadges[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    params.set("offset", "0");
    params.set("limit", String(DASHBOARD_PREVIEW_LIMIT));

    fetch(`/api/jobs?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setJobs((data.jobs ?? []).slice(0, DASHBOARD_PREVIEW_LIMIT));
      })
      .catch(() => {
        if (!cancelled) {
          setError("맞춤 공고를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto flex w-full flex-1 flex-col gap-8 px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
      <div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          안녕하세요, <span className="font-semibold text-zinc-900 dark:text-zinc-50">{email}</span>님
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          오늘의 맞춤 공고를 확인해보세요
        </h1>
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              ✨ 맞춤 공고 미리보기
            </h2>
            <span className="text-xs font-semibold text-zinc-400">
              진짜 신입 가능 공고
            </span>
          </div>
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-violet-60 hover:text-violet-70"
          >
            전체 보기 →
          </Link>
        </div>

        {loading && (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            공고를 불러오는 중...
          </p>
        )}
        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
        {!loading && !error && jobs.length === 0 && (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            조건에 맞는 맞춤 공고가 아직 없어요.
          </p>
        )}

        {jobs.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {jobs.map((job) => (
              <JobCardPreview key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>

      <ApplicationsSummarySection userId={userId} />
      <DeadlineSoonSection />
      <TrendsSummarySection />
      <ProfileNudgeSection profile={profile} />
    </div>
  );
}

/** ② 지원 현황 요약 — 칸반보드(P3) 4단계별 건수 + 마감 임박 건 강조 (PRD 5-9) */
function ApplicationsSummarySection({ userId }: { userId: string }) {
  const [applications, setApplications] = useState<Application[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    listApplications(userId).then((result) => {
      if (!cancelled) setApplications(result);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // 소스 기능(P3)에서 아직 데이터가 없으면(로딩 포함) 빈 섹션을 노출하지 않는다.
  if (!applications || applications.length === 0) return null;

  const dueSoon = applications.filter((application) => isDueWithinDays(application.dueTime, DEADLINE_SOON_DAYS));

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
          🗂️ 지원 현황 요약
        </h2>
        <Link
          href="/applications"
          className="text-sm font-semibold text-violet-60 hover:text-violet-70"
        >
          칸반보드 보기 →
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {APPLICATION_STATUSES.map((status) => (
          <Card key={status} className="flex flex-col items-center gap-1 p-4 text-center">
            <span className="text-2xl font-bold text-violet-60">
              {applications.filter((application) => application.status === status).length}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {APPLICATION_STATUS_LABELS[status]}
            </span>
          </Card>
        ))}
      </div>

      {dueSoon.length > 0 && (
        <p className="mt-3 text-sm text-red-500">
          마감 임박 {dueSoon.length}건이 있어요 — 지원 현황에서 확인해보세요.
        </p>
      )}
    </div>
  );
}

/** ③ 마감임박 알림 — D-3 이내 공고 리스트 (지도 위젯 P5의 리스트 뷰 축약판, PRD 5-9) */
function DeadlineSoonSection() {
  const [jobs, setJobs] = useState<JobWithBadges[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/jobs?limit=20`)
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const upcoming = ((data.jobs ?? []) as JobWithBadges[])
          .filter((job) => isDueWithinDays(job.due_time, DEADLINE_SOON_DAYS))
          .sort((a, b) => new Date(a.due_time!).getTime() - new Date(b.due_time!).getTime());
        setJobs(upcoming);
      })
      .catch(() => {
        if (!cancelled) setJobs([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!jobs || jobs.length === 0) return null;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
          ⏰ 마감임박 알림
        </h2>
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-violet-60 hover:text-violet-70"
        >
          지도에서 보기 →
        </Link>
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        {jobs.slice(0, 5).map((job) => (
          <Card key={job.id} className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {job.position}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{job.company.name}</p>
            </div>
            <DdayBadge dueDate={job.due_time!} className="shrink-0" />
          </Card>
        ))}
      </div>
    </div>
  );
}

interface TrendSkillPreview {
  skill_tag_id: number;
  skill_tag_title: string;
  count: number;
}

/** ④ 트렌드 인사이트 요약 — 신입 공고 TOP3 스킬 축약 노출 (PRD 5-9, P6 연동) */
function TrendsSummarySection() {
  const [skills, setSkills] = useState<TrendSkillPreview[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/trends/skills")
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setSkills((data.skills ?? []).slice(0, TREND_PREVIEW_LIMIT));
      })
      .catch(() => {
        if (!cancelled) setSkills([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!skills || skills.length === 0) return null;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
          📈 신입 채용 트렌드
        </h2>
        <Link
          href="/trends"
          className="text-sm font-semibold text-violet-60 hover:text-violet-70"
        >
          더보기 →
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {skills.map((skill, index) => (
          <Badge key={skill.skill_tag_id} tone="violet">
            TOP{index + 1} {skill.skill_tag_title}
          </Badge>
        ))}
      </div>
    </div>
  );
}

/** ⑤ 프로필 완성도 넛지 — 스킬 태그 등록이 적으면 매칭(P4) 정확도를 위해 보완 유도 (PRD 5-9) */
function ProfileNudgeSection({ profile }: { profile: UserProfile }) {
  if (profile.skillTags.length >= SKILL_TAG_NUDGE_THRESHOLD) return null;

  return (
    <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <CardTitle>스킬 태그를 더 등록해보세요</CardTitle>
        <CardDescription>
          현재 {profile.skillTags.length}개 등록돼 있어요. 스킬 태그가 많을수록 JD
          매칭 진단이 더 정확해져요.
        </CardDescription>
      </div>
      <Link href="/profile" className="shrink-0">
        <Button variant="outline">프로필 보완하기</Button>
      </Link>
    </Card>
  );
}
