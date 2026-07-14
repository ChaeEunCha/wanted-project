import { HTMLAttributes } from "react";

/**
 * "진짜 신입 가능" 뱃지 (PRD 5-1 / 5-9절).
 *
 * `annual_from`/`annual_to` 파싱 결과(P0-신입 맞춤 필터 대시보드 로직)로
 * "진짜 신입 지원 가능" 여부가 확정된 공고에 붙이는 신뢰/필터링 요소다.
 * product-designer.md 원칙("신뢰/필터링 요소는 트렌디한 톤 안에서도 시각적으로
 * 확실히 눈에 띄게")에 따라 violet-30 그라디언트 pill + 이모지 포인트로 강조한다.
 *
 * 판정 로직 자체(annual_from/annual_to 파싱)는 이 컴포넌트의 책임이 아니다 —
 * 호출부(공고 카드/목록)에서 판정이 끝난 boolean 결과만 받아 렌더링만 담당한다.
 */
export function EntryFriendlyBadge({
  className = "",
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-20 to-violet-30 px-3 py-1 text-xs font-bold text-violet-90 shadow-sm ring-1 ring-inset ring-violet-30/50 ${className}`}
      {...props}
    >
      <span aria-hidden>✨</span>
      진짜 신입 가능
    </span>
  );
}
