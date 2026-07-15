import { getSupabaseClient } from "./supabase/client";

/**
 * JD 매칭 진단 & 갭 체크리스트(P4) 데이터 저장소 — `gap_checklist_items` 테이블
 * (supabase/migrations/0003_gap_checklist.sql, DB.md 3.7, PRD 5-6).
 *
 * 매칭률은 저장하지 않고 요청 시 skill_tags 교집합으로 즉시 계산한다(matching.ts).
 * 이 스토어는 "체크 여부"만 영속화한다 — 체크한다고 프로필 skill_tags가 자동으로
 * 추가되지는 않는다(PRD 5-6).
 */

export type GapChecklistResult = { ok: true } | { ok: false; error: string };

/** 특정 공고에 대해 사용자가 체크해 둔 skill_tag_id 집합 */
export async function listCheckedSkillTagIds(userId: string, jobId: number): Promise<Set<number>> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("gap_checklist_items")
    .select("skill_tag_id")
    .eq("user_id", userId)
    .eq("job_id", jobId)
    .eq("is_checked", true);

  if (error || !data) return new Set();
  return new Set(data.map((row) => row.skill_tag_id));
}

export async function setGapChecklistItem(
  userId: string,
  jobId: number,
  skillTagId: number,
  isChecked: boolean
): Promise<GapChecklistResult> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("gap_checklist_items").upsert(
    {
      user_id: userId,
      job_id: jobId,
      skill_tag_id: skillTagId,
      is_checked: isChecked,
      checked_at: isChecked ? new Date().toISOString() : null,
    },
    { onConflict: "user_id,job_id,skill_tag_id" }
  );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
