import { NextRequest, NextResponse } from "next/server";
import { fetchJobDetail, fetchJobList } from "@/lib/wanted/client";
import { describeEntryLevel, extractQualificationBadges } from "@/lib/wanted/qualificationBadges";
import type { JobWithBadges } from "@/lib/types";

const DEFAULT_LIMIT = 12;

function parseIntArray(values: string[]): number[] {
  return values
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isFinite(value));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoryTags = parseIntArray(searchParams.getAll("category_tags"));
  const locations = searchParams.getAll("locations");
  const offset = Number.parseInt(searchParams.get("offset") ?? "0", 10) || 0;
  const limit =
    Number.parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT;

  try {
    const { jobs, hasNext } = await fetchJobList({
      categoryTags: categoryTags.length > 0 ? categoryTags : undefined,
      locations: locations.length > 0 ? locations : undefined,
      // 이 대시보드는 "진짜 신입 가능" 공고만 다루는 게 목적이라 years는 항상 [0]으로 고정한다
      // (UI에 별도 경력 필터를 노출하지 않음). 단, 라이브 API로 직접 확인한 결과 이 값이
      // annual_from > 0인 공고를 완전히 걸러주지는 않아(느슨한 필터), 최종 판별은 각 공고의
      // annual_from을 다시 파싱하는 isTrulyEntryLevel 뱃지가 담당한다.
      years: [0],
      offset,
      limit,
    });

    const detailResults = await Promise.allSettled(jobs.map((job) => fetchJobDetail(job.id)));

    const merged: JobWithBadges[] = jobs.flatMap((job, index) => {
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
          geoLocation: detail.address?.geo_location?.location,
        } satisfies JobWithBadges,
      ];
    });

    return NextResponse.json({ jobs: merged, hasNext });
  } catch (error) {
    console.error("[/api/jobs] failed to load job list", error);
    return NextResponse.json(
      { error: "공고 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요." },
      { status: 502 }
    );
  }
}
