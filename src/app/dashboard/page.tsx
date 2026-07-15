"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { addApplication } from "@/lib/applicationsStore";
import { getSessionUser } from "@/lib/authStore";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { KakaoMap } from "@/components/map/KakaoMap";
import type { MapMarkerData } from "@/components/map/types";
import { DdayBadge } from "@/components/ui/DdayBadge";
import { EntryFriendlyBadge } from "@/components/ui/EntryFriendlyBadge";
import { FilterChip } from "@/components/ui/FilterChip";
import { MatchDiagnosis } from "@/components/ui/MatchDiagnosis";
import type { CategoryTag, CategorySubTag, JobWithBadges, UserProfile } from "@/lib/types";
import { getProfile } from "@/lib/authStore";

// P5 마감임박 지도 위젯: 대시보드가 이미 필터링해 화면에 노출 중인 공고만 마커로 그린다
// (PRD 5-7절 — 전체 공고를 별도로 다시 조회하지 않고 "화면에 노출되는 공고만" 좌표를 쓴다).
// 지원한 곳/관심 등록 마커는 P3(지원 여정 칸반보드) 데이터가 아직 없어 이 대시보드에서는
// 마감임박(deadline) 마커만 그린다 — P3 연동 시 kind별 마커를 추가로 합칠 것.
function jobToMarker(job: JobWithBadges): MapMarkerData | null {
  if (!job.geoLocation) return null;
  return {
    id: job.id,
    lat: job.geoLocation.lat,
    lng: job.geoLocation.lng,
    kind: "deadline",
    companyName: job.company.name,
    position: job.position,
    dueDate: job.due_time,
    skillTags: job.qualificationBadges
      .filter((badge) => badge.category === "tool")
      .map((badge) => badge.label),
  };
}

const EARTH_RADIUS_KM = 6371;
const MIN_RADIUS_KM = 1;
const MAX_RADIUS_KM = 30;
const DEFAULT_RADIUS_KM = 10;

/** 두 좌표 간 직선거리(km) — PRD 5-7 "통근 필터 v1 범위"(직선 반경만, 소요시간 필터는 v2) */
function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

// openapi.json의 `/jobs` `locations` 파라미터는 배열 문자열일 뿐 별도 enum이 없어
// 자주 쓰이는 지역명을 큐레이션한 정적 목록으로 대체한다.
const REGION_OPTIONS = ["서울", "경기", "인천", "부산", "대구", "대전", "광주", "기타"];

const PAGE_SIZE = 12;

export default function DashboardPage() {
  const [categories, setCategories] = useState<CategoryTag[]>([]);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<number[]>([]);
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
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (viewMode !== "map" || userLocation || geoError) return;
    if (!navigator.geolocation) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 지도 뷰 진입 시 위치 API 지원 여부를 즉시 알려줘야 한다
      setGeoError("이 브라우저에서는 위치 정보를 사용할 수 없어요.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => {
        setGeoError("위치 권한을 허용하지 않아 반경 필터를 사용할 수 없어요. 전체 마커를 보여드려요.");
      }
    );
  }, [viewMode, userLocation, geoError]);

  useEffect(() => {
    let cancelled = false;
    getSessionUser()
      .then((sessionUser) => {
        if (!cancelled) setUserId(sessionUser?.id ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 로그아웃 시 이전 유저의 프로필을 즉시 비워야 매칭 진단에 남아있지 않는다
      setProfile(null);
      return;
    }
    let cancelled = false;
    getProfile(userId).then((result) => {
      if (!cancelled) setProfile(result);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

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

  function toggleExpandedCategory(categoryId: number) {
    setExpandedCategoryIds((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
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
    <div className="mx-auto flex w-full flex-1 flex-col gap-6 px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
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
          <div className="mt-3 flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const subTagCount = category.sub_tags.filter((subTag) =>
                  selectedSubTags.some((t) => t.id === subTag.id)
                ).length;
                return (
                  <FilterChip
                    key={category.id}
                    label={subTagCount > 0 ? `${category.title} (${subTagCount})` : category.title}
                    selected={expandedCategoryIds.includes(category.id)}
                    onClick={() => toggleExpandedCategory(category.id)}
                  />
                );
              })}
            </div>
            {categories
              .filter((category) => expandedCategoryIds.includes(category.id))
              .map((category) => (
                <div
                  key={category.id}
                  className="flex flex-wrap gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800"
                >
                  {category.sub_tags.map((subTag) => (
                    <FilterChip
                      key={subTag.id}
                      label={subTag.title}
                      selected={selectedSubTags.some((t) => t.id === subTag.id)}
                      onClick={() => toggleSubTag(subTag)}
                    />
                  ))}
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
              <FilterChip
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

      {!loading && !error && jobs.length > 0 && (
        <div className="flex gap-2">
          <FilterChip label="목록" selected={viewMode === "list"} onClick={() => setViewMode("list")} />
          <FilterChip label="지도" selected={viewMode === "map"} onClick={() => setViewMode("map")} />
        </div>
      )}

      {viewMode === "map" && jobs.length > 0 && (() => {
        const allMarkers = jobs.map(jobToMarker).filter((m) => m !== null);
        const visibleMarkers = allMarkers.filter(
          (m) => !userLocation || distanceKm(userLocation, m) <= radiusKm
        );
        const hiddenByRadius = userLocation ? allMarkers.length - visibleMarkers.length : 0;

        return (
          <div className="flex flex-col gap-3">
            {userLocation ? (
              <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-300">
                <label htmlFor="radius" className="shrink-0">
                  내 위치 반경 {radiusKm}km
                </label>
                <input
                  id="radius"
                  type="range"
                  min={MIN_RADIUS_KM}
                  max={MAX_RADIUS_KM}
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="flex-1 accent-violet-30"
                />
              </div>
            ) : (
              geoError && <p className="text-xs text-zinc-400">{geoError}</p>
            )}

            {allMarkers.length === 0 && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                이 공고들은 좌표 정보가 없어서 지도에 표시할 수 없어요.
              </p>
            )}

            {allMarkers.length > 0 && visibleMarkers.length === 0 && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                내 위치 반경 {radiusKm}km 안에는 공고가 없어요 (전체 {allMarkers.length}건 중{" "}
                {hiddenByRadius}건이 반경 밖). 반경을 넓혀보세요.
              </p>
            )}

            <KakaoMap markers={visibleMarkers} />
          </div>
        );
      })()}

      {viewMode === "list" && (
        <div className="flex flex-col gap-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} userId={userId} profile={profile} />
          ))}
        </div>
      )}

      {hasNext && !loading && viewMode === "list" && (
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

type AddToKanbanState = "idle" | "adding" | "added" | "error";

function JobCard({
  job,
  userId,
  profile,
}: {
  job: JobWithBadges;
  userId: string | null;
  profile: UserProfile | null;
}) {
  const [addState, setAddState] = useState<AddToKanbanState>("idle");
  const [addError, setAddError] = useState<string | null>(null);

  async function handleAddToKanban() {
    if (!userId) {
      window.location.href = "/login";
      return;
    }
    setAddState("adding");
    setAddError(null);
    const result = await addApplication(userId, job);
    if (result.ok) {
      setAddState("added");
    } else {
      setAddState("error");
      setAddError(result.error);
    }
  }

  return (
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
            <span className="text-xs text-zinc-400">{job.entryLevelSupportingText}</span>
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

      <MatchDiagnosis job={job} profile={profile} userId={userId} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href={`/dashboard/${job.id}`}
            className="text-sm font-medium text-violet-60 hover:underline dark:text-violet-30"
          >
            회사 정보 보기 →
          </Link>
          <a
            href={job.url}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            원티드에서 공고 보기 →
          </a>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={addState === "adding" || addState === "added"}
          onClick={handleAddToKanban}
        >
          {addState === "added" ? "담았어요" : addState === "adding" ? "담는 중..." : "칸반보드에 담기"}
        </Button>
      </div>
      {addState === "error" && addError && (
        <p className="text-xs text-red-500">{addError}</p>
      )}
    </Card>
  );
}
