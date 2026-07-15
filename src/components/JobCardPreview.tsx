import { Badge } from "@/components/ui/Badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { DdayBadge } from "@/components/ui/DdayBadge";
import { EntryFriendlyBadge } from "@/components/ui/EntryFriendlyBadge";
import type { JobWithBadges } from "@/lib/types";

const MAX_PREVIEW_BADGES = 2;

/**
 * 홈 화면 "① 맞춤 공고 미리보기" 섹션 전용 축약 카드 (PRD 5-9절).
 *
 * `/dashboard`의 JobCard(src/app/dashboard/page.tsx)와 동일한 데이터(JobWithBadges)를 쓰지만,
 * 미리보기라 정보 밀도를 낮춘다 — 자격요건 뱃지는 최대 2개만 보여주고 "기타 자격요건"
 * 리스트는 생략한다. JobCard는 dashboard 페이지 내부에 로컬로 남겨두고, 이 컴포넌트를
 * 별도로 분리해 목적이 다른 두 화면이 서로의 표시 규칙 변경에 영향받지 않게 했다.
 */
export function JobCardPreview({ job }: { job: JobWithBadges }) {
  const previewBadges = job.qualificationBadges.slice(0, MAX_PREVIEW_BADGES);

  return (
    <a href={job.url} target="_blank" rel="noreferrer" className="block">
      <Card className="flex h-full flex-col gap-3 p-5 transition-shadow hover:shadow-md sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{job.position}</CardTitle>
            <CardDescription className="mt-0.5">{job.company.name}</CardDescription>
          </div>
          {job.due_time ? (
            <DdayBadge dueDate={job.due_time} className="shrink-0" />
          ) : (
            <span className="shrink-0 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              상시
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {job.isTrulyEntryLevel && <EntryFriendlyBadge />}
        </div>

        {previewBadges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {previewBadges.map((badge, index) => (
              <Badge key={`${badge.category}-${index}`} tone="violet">
                {badge.label}
              </Badge>
            ))}
          </div>
        )}
      </Card>
    </a>
  );
}
