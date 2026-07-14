import { NextRequest, NextResponse } from "next/server";
import { fetchJobDetail, fetchJobList, type JobListParams } from "@/lib/wanted/client";
import { describeEntryLevel, extractQualificationBadges } from "@/lib/wanted/qualificationBadges";
import type { JobListItem, JobWithBadges } from "@/lib/types";

const DEFAULT_LIMIT = 12;
// 원티드 API의 `years=[0]` 필터가 느슨해(annual_from > 0인 공고도 섞여 나옴), 배치를 여러 번
// 가져와 진짜 entry-level(annual_from === 0)인 공고만 골라 모은다. 배치 수를 제한해 요청당
// 상세 조회(N+1) 비용과 지연시간을 bound한다.
const MAX_UPSTREAM_BATCHES = 4;

function parseIntArray(values: string[]): number[] {
  return values
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isFinite(value));
}

async function mergeBatch(jobs: JobListItem[]): Promise<JobWithBadges[]> {
  const detailResults = await Promise.allSettled(jobs.map((job) => fetchJobDetail(job.id)));

  return jobs.flatMap((job, index) => {
    const result = detailResults[index];
    if (result.status !== "fulfilled") return [];
    const detail = result.value;
    const { badges, otherLines } = extractQualificationBadges(detail);
    const { isTrulyEntryLevel, supportingText } = describeEntryLevel(
      detail.annual_from,
      detail.annual_to
    );

    return [
      {
        id: job.id,
        position: job.position,
        company: job.company,
        url: job.url,
        due_time: job.due_time ?? detail.due_time,
        address: job.address,
        category_tags: job.category_tags ?? detail.category_tags,
        annual_from: detail.annual_from,
        annual_to: detail.annual_to,
        isTrulyEntryLevel,
        entryLevelSupportingText: supportingText,
        qualificationBadges: badges,
        otherLines,
        preferredPoints: detail.detail?.preferred_points,
        benefits: detail.detail?.benefits,
      } satisfies JobWithBadges,
    ];
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoryTags = parseIntArray(searchParams.getAll("category_tags"));
  const locations = searchParams.getAll("locations");
  // `offset`은 클라이언트 결과 개수가 아니라 원티드 API 원본 목록에서 이어받을 커서다
  // (entry-level 필터링으로 배치마다 결과 수가 달라 클라이언트 jobs.length와 불일치할 수 있음).
  let cursor = Number.parseInt(searchParams.get("offset") ?? "0", 10) || 0;
  const limit =
    Number.parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT;

  const baseParams: Omit<JobListParams, "offset" | "limit"> = {
    categoryTags: categoryTags.length > 0 ? categoryTags : undefined,
    locations: locations.length > 0 ? locations : undefined,
    // 이 대시보드는 "진짜 신입 가능" 공고만 다루는 게 목적이라 years는 항상 [0]으로 고정한다
    // (UI에 별도 경력 필터를 노출하지 않음).
    years: [0],
  };

  try {
    const entryLevelJobs: JobWithBadges[] = [];
    let upstreamHasNext = true;

    for (let batch = 0; batch < MAX_UPSTREAM_BATCHES && entryLevelJobs.length < limit; batch++) {
      const { jobs, hasNext } = await fetchJobList({ ...baseParams, offset: cursor, limit });
      upstreamHasNext = hasNext;
      cursor += jobs.length;
      if (jobs.length === 0) break;

      const merged = await mergeBatch(jobs);
      entryLevelJobs.push(...merged.filter((job) => job.isTrulyEntryLevel));

      if (!hasNext) break;
    }

    return NextResponse.json({
      jobs: entryLevelJobs,
      hasNext: upstreamHasNext,
      nextOffset: cursor,
    });
  } catch (error) {
    console.error("[/api/jobs] failed to load job list", error);
    return NextResponse.json(
      { error: "공고 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요." },
      { status: 502 }
    );
  }
}
