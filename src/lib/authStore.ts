import { findMockCategorySubTag } from "./mockTags";
import { getSupabaseClient } from "./supabase/client";
import type { CareerYears, CategorySubTag, PortfolioEntry, SkillTag, UserProfile } from "./types";

/**
 * Supabase 연동 인증/프로필 저장소.
 *
 * - 인증: 커스텀 users/password_hash 테이블 없이 Supabase Auth(`auth.users`)를 그대로 사용한다
 *   (`supabase.auth.signUp` / `signInWithPassword` / `signOut` / `getSession`).
 * - 프로필 데이터: `profiles` / `profile_category_tags` / `profile_skill_tags` / `portfolios`
 *   테이블(supabase/migrations/0001_init.sql)에 저장하며, 각 테이블의 user_id는
 *   `auth.users(id)`를 참조하고 RLS로 본인 데이터만 조회/수정 가능하다.
 *
 * TODO(포트폴리오 파일 업로드): Supabase Storage 버킷/정책이 아직 미정이라(DB.md 6절 미정 사항)
 * type='file'인 경우 실제 업로드 대신 파일명만 file_key 컬럼에 저장한다.
 * 버킷/정책이 정해지면 PortfolioField에서 실제 업로드를 수행하고 그 결과 key를 저장하도록 교체해야 한다.
 */

export type AuthResult = { ok: true } | { ok: false; error: string };

export interface SessionUser {
  id: string;
  email: string | null;
}

function translateAuthError(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes("already registered") || normalized.includes("already exists")) {
    return "이미 가입된 이메일이에요.";
  }
  if (normalized.includes("invalid login credentials")) {
    return "이메일 또는 비밀번호가 올바르지 않아요.";
  }
  if (normalized.includes("password")) {
    return "비밀번호 조건을 확인해 주세요 (8자 이상).";
  }
  return message;
}

export async function signUp(email: string, password: string): Promise<AuthResult> {
  const supabase = getSupabaseClient();
  const normalized = email.trim().toLowerCase();

  const { data, error } = await supabase.auth.signUp({
    email: normalized,
    password,
  });

  if (error) {
    return { ok: false, error: translateAuthError(error.message) };
  }

  // 이메일 확인(Confirm email)이 켜져 있는 프로젝트에서는 이미 가입된 이메일이어도 에러 대신
  // identities가 빈 배열인 user를 반환하는 경우가 있다 (Supabase Auth 특성) — 별도로 감지한다.
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { ok: false, error: "이미 가입된 이메일이에요." };
  }

  return { ok: true };
}

export async function logIn(email: string, password: string): Promise<AuthResult> {
  const supabase = getSupabaseClient();
  const normalized = email.trim().toLowerCase();

  const { error } = await supabase.auth.signInWithPassword({
    email: normalized,
    password,
  });

  if (error) {
    return { ok: false, error: translateAuthError(error.message) };
  }
  return { ok: true };
}

export async function logOut(): Promise<void> {
  const supabase = getSupabaseClient();
  await supabase.auth.signOut();
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = getSupabaseClient();
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return null;
  return { id: user.id, email: user.email ?? null };
}

const EMPTY_PROFILE: UserProfile = {
  careerYears: null,
  categoryTags: [],
  skillTags: [],
  portfolios: [],
};

export async function getProfile(userId: string): Promise<UserProfile> {
  const supabase = getSupabaseClient();

  const [profileResult, categoryResult, skillResult, portfolioResult] = await Promise.all([
    supabase.from("profiles").select("career_years").eq("user_id", userId).maybeSingle(),
    supabase.from("profile_category_tags").select("category_tag_id").eq("user_id", userId),
    supabase
      .from("profile_skill_tags")
      .select("skill_tag_id, skill_tag_title")
      .eq("user_id", userId),
    supabase.from("portfolios").select("id, type, url, file_key").eq("user_id", userId),
  ]);

  if (profileResult.error || categoryResult.error || skillResult.error || portfolioResult.error) {
    // 조회 실패 시(네트워크 문제 등) 빈 프로필로 안전하게 대체한다.
    // (아직 저장한 적 없는 사용자는 에러가 아니라 빈 배열/ null 데이터로 내려온다.)
    return EMPTY_PROFILE;
  }

  const categoryTags: CategorySubTag[] = (categoryResult.data ?? [])
    .map((row) => findMockCategorySubTag(row.category_tag_id))
    .filter((tag): tag is CategorySubTag => Boolean(tag));

  const skillTags: SkillTag[] = (skillResult.data ?? []).map((row) => ({
    id: row.skill_tag_id,
    title: row.skill_tag_title,
  }));

  const portfolios: PortfolioEntry[] = (portfolioResult.data ?? []).map((row) => ({
    id: String(row.id),
    type: row.type as PortfolioEntry["type"],
    url: row.url ?? undefined,
    fileName: row.type === "file" ? (row.file_key ?? undefined) : undefined,
  }));

  return {
    careerYears: (profileResult.data?.career_years ?? null) as CareerYears | null,
    categoryTags,
    skillTags,
    portfolios,
  };
}

export async function saveProfile(
  userId: string,
  profile: UserProfile
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabaseClient();

  const { error: profileError } = await supabase.from("profiles").upsert({
    user_id: userId,
    career_years: profile.careerYears,
    updated_at: new Date().toISOString(),
  });
  if (profileError) {
    return { ok: false, error: profileError.message };
  }

  // 태그/포트폴리오는 "현재 화면 상태가 곧 전체 목록"이므로 전체 삭제 후 재삽입한다
  // (개별 diff보다 단순하고, 이 프로젝트 규모에서는 트랜잭션 원자성보다 구현 단순성을 우선했다).
  const { error: deleteCategoryError } = await supabase
    .from("profile_category_tags")
    .delete()
    .eq("user_id", userId);
  if (deleteCategoryError) {
    return { ok: false, error: deleteCategoryError.message };
  }
  if (profile.categoryTags.length > 0) {
    const { error } = await supabase.from("profile_category_tags").insert(
      profile.categoryTags.map((tag) => ({
        user_id: userId,
        category_tag_id: tag.id,
      }))
    );
    if (error) return { ok: false, error: error.message };
  }

  const { error: deleteSkillError } = await supabase
    .from("profile_skill_tags")
    .delete()
    .eq("user_id", userId);
  if (deleteSkillError) {
    return { ok: false, error: deleteSkillError.message };
  }
  if (profile.skillTags.length > 0) {
    const { error } = await supabase.from("profile_skill_tags").insert(
      profile.skillTags.map((tag) => ({
        user_id: userId,
        skill_tag_id: tag.id,
        skill_tag_title: tag.title,
      }))
    );
    if (error) return { ok: false, error: error.message };
  }

  const { error: deletePortfolioError } = await supabase
    .from("portfolios")
    .delete()
    .eq("user_id", userId);
  if (deletePortfolioError) {
    return { ok: false, error: deletePortfolioError.message };
  }
  const validPortfolios = profile.portfolios.filter(
    (p) => (p.type === "url" && p.url?.trim()) || (p.type === "file" && p.fileName)
  );
  if (validPortfolios.length > 0) {
    const { error } = await supabase.from("portfolios").insert(
      validPortfolios.map((p) => ({
        user_id: userId,
        type: p.type,
        url: p.type === "url" ? p.url : null,
        // TODO(포트폴리오 파일 업로드): Storage 버킷 정책 확정 전까지는 파일명을 file_key에 그대로 저장.
        file_key: p.type === "file" ? p.fileName : null,
      }))
    );
    if (error) return { ok: false, error: error.message };
  }

  return { ok: true };
}

export type { CareerYears, CategorySubTag, SkillTag, PortfolioEntry, UserProfile };
