import { getSupabaseClient } from "./supabase/client";
import type { Application, ApplicationStatus, JobWithBadges } from "./types";

/**
 * 지원 여정 칸반보드(P3) 데이터 저장소 — `applications` 테이블
 * (supabase/migrations/0002_applications.sql, DB.md 3.6, PRD 5-5).
 *
 * authStore.ts와 동일한 패턴: Supabase 클라이언트를 지연 생성해 호출하고,
 * RLS로 본인 데이터만 조회/수정 가능하다.
 */

export type ApplicationResult = { ok: true } | { ok: false; error: string };

interface ApplicationRow {
  id: number;
  job_id: number;
  status: ApplicationStatus;
  company_name_snapshot: string;
  due_time_snapshot: string | null;
  skill_tags_snapshot: { id: number; text: string }[] | null;
  job_url_snapshot: string;
  created_at: string;
  updated_at: string;
}

function toApplication(row: ApplicationRow): Application {
  return {
    id: String(row.id),
    jobId: row.job_id,
    status: row.status,
    companyName: row.company_name_snapshot,
    dueTime: row.due_time_snapshot ?? undefined,
    skillTags: row.skill_tags_snapshot ?? [],
    jobUrl: row.job_url_snapshot,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const APPLICATION_COLUMNS =
  "id, job_id, status, company_name_snapshot, due_time_snapshot, skill_tags_snapshot, job_url_snapshot, created_at, updated_at";

export async function listApplications(userId: string): Promise<Application[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("applications")
    .select(APPLICATION_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as ApplicationRow[]).map(toApplication);
}

/**
 * 대시보드 공고 카드에서 칸반보드로 추가한다. 이 시점의 회사명/마감일/스킬태그를
 * 스냅샷으로 복사 저장한다(PRD 5-5 핵심 설계 포인트 — 원본 공고가 만료돼도 카드 유지).
 */
export async function addApplication(userId: string, job: JobWithBadges): Promise<ApplicationResult> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("applications").insert({
    user_id: userId,
    job_id: job.id,
    company_name_snapshot: job.company.name,
    due_time_snapshot: job.due_time ?? null,
    skill_tags_snapshot: job.skill_tags ?? [],
    job_url_snapshot: job.url,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "이미 칸반보드에 추가된 공고예요." };
    }
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus
): Promise<ApplicationResult> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("applications")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", applicationId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function removeApplication(applicationId: string): Promise<ApplicationResult> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("applications").delete().eq("id", applicationId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
