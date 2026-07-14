/**
 * 도메인 타입 정의.
 *
 * - Wanted API 관련 타입(SkillTag, CategoryTag)은 openapi.json의
 *   ParentTagResponseSerializer / TagResponseSerializer 필드명을 그대로 따른다.
 * - User/Profile/Portfolio는 PRD.md 5-2절의 자체 DB 데이터 모델(users, profiles,
 *   profile_category_tags, profile_skill_tags, portfolios)을 프론트엔드 관점으로 옮긴 것으로,
 *   실제로는 백엔드 API 응답 타입으로 교체되어야 한다.
 */

/** 원티드 API `/tags/skills` 응답 항목 (`{id, title}`) */
export interface SkillTag {
  id: number;
  title: string;
}

/** 원티드 API `/tags/categories` 응답의 하위 태그 (`sub_tags[]`) */
export interface CategorySubTag {
  id: number;
  parent_id: number;
  title: string;
}

/** 원티드 API `/tags/categories` 응답의 상위 태그 */
export interface CategoryTag {
  id: number;
  title: string;
  sub_tags: CategorySubTag[];
}

/** 경력 연차: PRD 5-2 AC에 따라 0~2 정수로만 제한 */
export type CareerYears = 0 | 1 | 2;

export type PortfolioType = "url" | "file";

export interface PortfolioEntry {
  id: string;
  type: PortfolioType;
  /** type === "url"일 때 사용 */
  url?: string;
  /** type === "file"일 때 사용 (v1: 파일명만 클라이언트에 보관, 실제 업로드는 TODO) */
  fileName?: string;
}

export interface UserProfile {
  careerYears: CareerYears | null;
  /** profile_category_tags: 관심 직군 (category_tag_id 다중 선택) */
  categoryTags: CategorySubTag[];
  /** profile_skill_tags: 관심 스킬 (skill_tag_id 다중 선택, 제목 매칭 아님) */
  skillTags: SkillTag[];
  /** portfolios: URL 또는 파일, 최소 1개 이상 */
  portfolios: PortfolioEntry[];
}

export interface MockUser {
  email: string;
  createdAt: string;
}
