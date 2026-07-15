import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchJobDetail, fetchJobList } from "@/lib/wanted/client";
import { describeEntryLevel } from "@/lib/wanted/qualificationBadges";

// PRD 5-8: "P0(신입 맞춤 필터)에서 정의한 '진짜 신입 가능' 판정 기준과 동일한 기준으로
// 필터링한 공고를 대상으로 skill_tags 출현 빈도를 집계해 TOP10을 낸다."
// 배치(예: 1일 1회) 집계 후 캐싱된 결과를 서빙하는 게 목표라, 요청마다 매번 원티드 API를
// 훑지 않도록 skill_trend_snapshots에 오늘 날짜(aggregated_at) 캐시가 있으면 그걸 그대로 쓴다.

const TOP_N = 10;
// 신입 공고 전수를 다 훑으면 호출량이 너무 커지므로(공고당 상세 조회 1회 필요),
// v1은 최신 공고 중 이 개수까지만 표본으로 집계한다. 실사용 트래픽이 커지면
// 실제 배치 스케줄러 + 페이지네이션 확장을 검토해야 한다(PRD 9절 리스크 참고).
const SAMPLE_SIZE = 60;
const PAGE_LIMIT = 20;

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createClient(url, anonKey);
}

interface TrendRow {
  skill_tag_id: number;
  skill_tag_title: string;
  category_tag_id: number | null;
  rank: number;
  count: number;
}

async function aggregateSkillFrequency(categoryTagId?: number): Promise<TrendRow[]> {
  const counts = new Map<string, { title: string; count: number }>();
  let offset = 0;
  let sampled = 0;

  while (sampled < SAMPLE_SIZE) {
    const { jobs, hasNext } = await fetchJobList({
      categoryTags: categoryTagId ? [categoryTagId] : undefined,
      years: [0],
      offset,
      limit: PAGE_LIMIT,
    });
    if (jobs.length === 0) break;

    const details = await Promise.allSettled(jobs.map((job) => fetchJobDetail(job.id)));
    for (const result of details) {
      if (result.status !== "fulfilled") continue;
      const detail = result.value;
      const { isTrulyEntryLevel } = describeEntryLevel(detail.annual_from, detail.annual_to);
      if (!isTrulyEntryLevel) continue;

      for (const tag of detail.skill_tags ?? []) {
        // 일부 공고는 id가 0/null로 내려오는 경우가 있어(client.ts normalizeTag 참고)
        // id만으로는 서로 다른 스킬이 뭉뚱그려질 수 있다 — id+제목 조합을 키로 쓴다.
        const key = `${tag.id}:${tag.text.toLowerCase()}`;
        const existing = counts.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          counts.set(key, { title: tag.text, count: 1 });
        }
      }
    }

    sampled += jobs.length;
    offset += PAGE_LIMIT;
    if (!hasNext) break;
  }

  return Array.from(counts.entries())
    .filter(([, value]) => value.title.length > 0)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, TOP_N)
    .map(([key, value], index) => ({
      skill_tag_id: Number(key.split(":")[0]) || 0,
      skill_tag_title: value.title,
      category_tag_id: categoryTagId ?? null,
      rank: index + 1,
      count: value.count,
    }));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoryTagParam = searchParams.get("category_tags");
  const categoryTagId = categoryTagParam ? Number.parseInt(categoryTagParam, 10) : undefined;
  const today = new Date().toISOString().slice(0, 10);

  const supabase = getSupabaseServerClient();

  if (supabase) {
    let query = supabase
      .from("skill_trend_snapshots")
      .select("skill_tag_id, skill_tag_title, category_tag_id, rank, count")
      .eq("aggregated_at", today)
      .order("rank", { ascending: true });
    query = categoryTagId
      ? query.eq("category_tag_id", categoryTagId)
      : query.is("category_tag_id", null);

    const { data: cached, error: cacheError } = await query;
    if (!cacheError && cached && cached.length > 0) {
      return NextResponse.json({ skills: cached, source: "cache" });
    }
  }

  try {
    const rows = await aggregateSkillFrequency(categoryTagId);

    if (supabase && rows.length > 0) {
      // 캐싱 갱신: 오늘자 동일 category_tag_id 조합의 이전 결과를 지우고 새로 채운다
      // (skill_trend_snapshots에는 upsert용 유니크 제약이 없어 delete-then-insert로 처리).
      const deleteQuery = supabase.from("skill_trend_snapshots").delete().eq("aggregated_at", today);
      await (categoryTagId
        ? deleteQuery.eq("category_tag_id", categoryTagId)
        : deleteQuery.is("category_tag_id", null));

      await supabase.from("skill_trend_snapshots").insert(
        rows.map((row) => ({ ...row, aggregated_at: today }))
      );
    }

    return NextResponse.json({ skills: rows, source: "live" });
  } catch (error) {
    console.error("[/api/trends/skills] failed to aggregate", error);
    return NextResponse.json(
      { error: "트렌드 데이터를 불러오지 못했어요. 잠시 후 다시 시도해 주세요." },
      { status: 502 }
    );
  }
}
