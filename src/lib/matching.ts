import type { JobTag, SkillTag } from "./types";

/**
 * JD 매칭 진단(PRD 5-6) 계산 결과.
 * 매칭률 = |공고 skill_tags ∩ 내 프로필 skill_tags| / |공고 skill_tags| (skill_tag_id 기준, 제목 매칭 금지).
 */
export interface MatchDiagnosis {
  matchRate: number;
  matchedTags: JobTag[];
  /** 프로필에 없는 공고 skill_tags — "이 스킬 채우면 매칭률 오름" 갭 리스트 */
  gapTags: JobTag[];
}

export function computeMatchDiagnosis(
  profileSkillTags: SkillTag[],
  jobSkillTags: JobTag[]
): MatchDiagnosis {
  const profileSkillIds = new Set(profileSkillTags.map((tag) => tag.id));
  const matchedTags = jobSkillTags.filter((tag) => profileSkillIds.has(tag.id));
  const gapTags = jobSkillTags.filter((tag) => !profileSkillIds.has(tag.id));

  return {
    matchRate: jobSkillTags.length === 0 ? 0 : matchedTags.length / jobSkillTags.length,
    matchedTags,
    gapTags,
  };
}
