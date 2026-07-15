import { NextRequest, NextResponse } from "next/server";
import { fetchCompanyInsight, fetchJobDetail } from "@/lib/wanted/client";
import { describeEntryLevel, extractQualificationBadges } from "@/lib/wanted/qualificationBadges";
import type { JobDetailWithInsight } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const jobId = Number.parseInt(id, 10);
  if (!Number.isFinite(jobId)) {
    return NextResponse.json({ error: "잘못된 공고 id예요." }, { status: 404 });
  }

  try {
    const detail = await fetchJobDetail(jobId);
    const { badges, otherLines } = extractQualificationBadges(detail);
    const { isTrulyEntryLevel, supportingText } = describeEntryLevel(
      detail.annual_from,
      detail.annual_to
    );

    const registrationNumber = detail.company?.registrationNumber;
    const hasRegistrationNumber = Boolean(registrationNumber);
    // registration_number가 없으면 insight 호출 자체를 시도하지 않는다 (헛된 API 요청 방지).
    const companyInsight = registrationNumber
      ? await fetchCompanyInsight(registrationNumber)
      : null;

    const result: JobDetailWithInsight = {
      id: detail.id,
      position: detail.detail?.position ?? "",
      company: detail.company ?? { id: 0, name: "" },
      url: detail.url,
      due_time: detail.due_time,
      annual_from: detail.annual_from,
      annual_to: detail.annual_to,
      isTrulyEntryLevel,
      entryLevelSupportingText: supportingText,
      qualificationBadges: badges,
      otherLines,
      benefits: detail.detail?.benefits,
      hasRegistrationNumber,
      companyInsight,
      // attraction_tags는 라이브 API 어디에도 없는 것으로 확인됨 (P1 작업 시 5개 공고 상세 응답 직접 검증) — 항상 빈 배열.
      attractionTags: [],
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error(`[/api/jobs/${id}] failed to load job detail`, error);
    return NextResponse.json(
      { error: "공고 상세 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요." },
      { status: 502 }
    );
  }
}
