import Link from "next/link";
import type { UserProfile } from "@/lib/types";

interface ProfileCompletionBannerProps {
  profile: UserProfile;
}

interface CompletionItem {
  label: string;
  done: boolean;
}

/**
 * 프로필 완성 유도 배너 (PRD 5-9절 "로그인(프로필 미완성)" 상태 전용).
 *
 * UserProfile의 4개 필드(careerYears/categoryTags/skillTags/portfolios) 완성 여부로
 * 완성도 %와 미입력 항목 칩을 계산해 보여준다. 지금은 홈 화면 최상단 고정 배너로만
 * 쓰이지만, 이후 P4(JD 매칭) 섹션의 노출 조건("프로필 미완성 시 매칭 대신 이 배너를 보여준다")에도
 * 그대로 재사용할 수 있도록 profile을 props로 받는 순수 컴포넌트로 설계했다.
 */
export function ProfileCompletionBanner({ profile }: ProfileCompletionBannerProps) {
  const items: CompletionItem[] = [
    { label: "경력", done: profile.careerYears !== null },
    { label: "관심 직군", done: profile.categoryTags.length > 0 },
    { label: "스킬 태그", done: profile.skillTags.length > 0 },
    { label: "포트폴리오", done: profile.portfolios.length > 0 },
  ];

  const doneCount = items.filter((item) => item.done).length;
  const percent = Math.round((doneCount / items.length) * 100);
  const missingItems = items.filter((item) => !item.done);

  return (
    <div className="flex flex-col gap-4 overflow-hidden rounded-3xl bg-gradient-to-br from-violet-20 to-violet-30 p-6 text-violet-90 shadow-lg shadow-violet-30/30 sm:flex-row sm:items-center sm:justify-between sm:p-7">
      <div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/55 px-3 py-1 text-xs font-bold text-violet-90">
          👋 시작이 반이에요
        </span>
        <p className="mt-2.5 text-lg font-bold sm:text-xl">
          프로필을 완성하면 맞춤 공고가 열려요
        </p>
        <p className="mt-1 max-w-md text-sm text-violet-70">
          경력·관심 직군·스킬 태그·포트폴리오를 채워야 &ldquo;진짜 신입 가능&rdquo; 맞춤 공고
          추천과 매칭 진단을 볼 수 있어요. 지금 2분이면 끝나요.
        </p>

        {missingItems.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {missingItems.map((item) => (
              <span
                key={item.label}
                className="rounded-full bg-white/60 px-2.5 py-0.5 text-xs font-bold text-violet-80"
              >
                ○ {item.label} 미입력
              </span>
            ))}
          </div>
        )}

        <div className="mt-3.5 h-2 max-w-xs overflow-hidden rounded-full bg-white/50">
          <div
            className="h-full rounded-full bg-violet-90"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs font-semibold text-violet-70">
          프로필 완성도 {percent}%
          {missingItems.length > 0
            ? ` · ${missingItems.length}개 항목만 더 채우면 완성!`
            : " · 완성!"}
        </p>
      </div>

      <div className="shrink-0">
        <Link
          href="/profile"
          className="inline-flex h-11 w-full items-center justify-center rounded-full bg-violet-90 px-5 text-sm font-medium text-white transition-colors hover:bg-black sm:w-auto"
        >
          프로필 마저 채우기 →
        </Link>
      </div>
    </div>
  );
}
