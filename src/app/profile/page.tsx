"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { CareerYearsSelect } from "@/components/profile/CareerYearsSelect";
import { CategoryTagPicker } from "@/components/profile/CategoryTagPicker";
import { PortfolioField } from "@/components/profile/PortfolioField";
import { SkillTagPicker } from "@/components/profile/SkillTagPicker";
import { getProfile, getSessionUser, saveProfile } from "@/lib/authStore";
import type { UserProfile } from "@/lib/types";

const EMPTY_PROFILE: UserProfile = {
  careerYears: null,
  categoryTags: [],
  skillTags: [],
  portfolios: [],
};

/**
 * P0 프로필/포트폴리오 화면 (마이페이지 겸용, PRD.md 5-2절).
 * 로그인 세션은 Supabase Auth 세션(`supabase.auth.getSession`)으로 확인하고,
 * 프로필 조회/저장은 profiles/profile_category_tags/profile_skill_tags/portfolios 테이블에
 * 직접 반영한다 — src/lib/authStore.ts 참고.
 */
export default function ProfilePage() {
  const router = useRouter();

  const [errors, setErrors] = useState<{
    careerYears?: string | null;
    portfolios?: string | null;
    form?: string | null;
  }>({});
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState<{
    checked: boolean;
    userId: string | null;
    email: string | null;
    isWelcome: boolean;
    profile: UserProfile;
  }>({ checked: false, userId: null, email: null, isWelcome: false, profile: EMPTY_PROFILE });

  useEffect(() => {
    // Supabase 세션/프로필 조회는 비동기 네트워크 호출이라 클라이언트 마운트 이후에만 가능하다
    // (SSR 시점엔 브라우저 세션에 접근할 수 없음). 이 값들은 서버에서 미리 알 수 없어
    // 렌더 중 계산으로 옮길 수 없다.
    let cancelled = false;

    async function load() {
      const sessionUser = await getSessionUser();
      if (cancelled) return;
      if (!sessionUser) {
        router.replace("/login");
        return;
      }
      const profile = await getProfile(sessionUser.id);
      if (cancelled) return;
      setSession({
        checked: true,
        userId: sessionUser.id,
        email: sessionUser.email,
        isWelcome: new URLSearchParams(window.location.search).get("welcome") === "1",
        profile,
      });
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const { checked: checkedSession, userId, email, profile, isWelcome } = session;
  const setProfile = (
    updater: UserProfile | ((prev: UserProfile) => UserProfile)
  ) =>
    setSession((prev) => ({
      ...prev,
      profile: typeof updater === "function" ? updater(prev.profile) : updater,
    }));

  async function handleSubmit() {
    const newErrors: typeof errors = {};
    if (profile.careerYears === null) {
      newErrors.careerYears = "경력을 선택해 주세요.";
    }
    const hasValidPortfolio = profile.portfolios.some(
      (p) => (p.type === "url" && p.url?.trim()) || (p.type === "file" && p.fileName)
    );
    if (!hasValidPortfolio) {
      newErrors.portfolios = "URL 또는 파일 중 최소 1개는 등록해 주세요.";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    if (!userId) return;

    setSaving(true);
    const result = await saveProfile(userId, profile);
    setSaving(false);

    if (!result.ok) {
      setErrors({ form: result.error });
      return;
    }
    setSavedAt(new Date().toLocaleTimeString());
  }

  if (!checkedSession) {
    return (
      <div className="mx-auto flex min-h-full w-full max-w-2xl flex-1 items-center justify-center px-4 py-16">
        <p className="text-sm text-zinc-500">확인 중...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-12 sm:py-16">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {isWelcome ? "프로필을 완성해 주세요" : "마이페이지 - 프로필/포트폴리오"}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {email} 계정으로 로그인됨 · 여기서 등록한 정보는 신입 맞춤 필터, JD 매칭,
          지원 여정 칸반보드 기능에서 재사용돼요.
        </p>
      </div>

      <Card className="flex flex-col gap-8">
        <div>
          <CardTitle>기본 정보</CardTitle>
          <CardDescription>경력 연차는 0~2년 범위에서만 선택할 수 있어요.</CardDescription>
          <div className="mt-4">
            <CareerYearsSelect
              value={profile.careerYears}
              onChange={(careerYears) =>
                setProfile((prev) => ({ ...prev, careerYears }))
              }
              error={errors.careerYears}
            />
          </div>
        </div>

        <div>
          <CategoryTagPicker
            value={profile.categoryTags}
            onChange={(categoryTags) =>
              setProfile((prev) => ({ ...prev, categoryTags }))
            }
          />
        </div>

        <div>
          <SkillTagPicker
            value={profile.skillTags}
            onChange={(skillTags) => setProfile((prev) => ({ ...prev, skillTags }))}
          />
        </div>

        <div>
          <PortfolioField
            value={profile.portfolios}
            onChange={(portfolios) =>
              setProfile((prev) => ({ ...prev, portfolios }))
            }
            error={errors.portfolios}
          />
        </div>

        {errors.form && (
          <p className="text-sm text-red-500" role="alert">
            {errors.form}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button onClick={handleSubmit} disabled={saving} className="w-full sm:w-auto">
            {saving ? "저장 중..." : "저장하기"}
          </Button>
          {savedAt && (
            <span className="text-sm text-emerald-600 dark:text-emerald-400">
              {savedAt}에 저장됨
            </span>
          )}
        </div>
      </Card>

      <p className="text-center text-sm text-zinc-400">
        <Link href="/" className="hover:underline">
          홈으로 돌아가기
        </Link>
      </p>
    </div>
  );
}
