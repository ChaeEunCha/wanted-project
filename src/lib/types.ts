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

/** `/jobs`(목록) 응답의 회사 정보 (`JobCompanyResponseSerializer` 중 목록에 필요한 부분만) */
export interface JobCompanySummary {
  id: number;
  name: string;
}

/** `/jobs`(목록) 응답의 주소 (`JobListAddressResponseSerializer`, `geo_location` 없음) */
export interface JobListAddress {
  country?: string;
  location?: string;
  full_location?: string;
}

/** `/jobs`(목록) 응답의 직군/직무 태그 (`CategoryTagResponseSerializer`) */
export interface JobCategoryTags {
  parent_tag?: JobTag;
  child_tags?: JobTag[];
}

/**
 * 공고 상세/목록 응답의 태그 항목 (`{id, text}`).
 * 프로필의 `SkillTag`(`{id, title}`)와 필드명이 달라 별도 타입으로 분리한다
 * (openapi.json: openapi__apis__v1__jobs__serializers__TagResponseSerializer).
 */
export interface JobTag {
  id: number;
  text: string;
}

/** `GET /jobs` 목록 응답 항목 (`JobListDetailResponseSerializer`) */
export interface JobListItem {
  id: number;
  status: string;
  due_time?: string;
  position: string;
  company: JobCompanySummary;
  address?: JobListAddress;
  category_tags?: JobCategoryTags;
  url: string;
}

/** `GET /jobs/{job_id}` 상세 응답의 `detail` 필드 (`JobDetailResponseSerializer`) */
export interface JobDetail {
  position?: string;
  intro?: string;
  main_tasks?: string;
  requirements?: string;
  preferred_points?: string;
  benefits?: string;
  hire_rounds?: string;
}

/** `GET /jobs/{job_id}` 상세 응답 (openapi__apis__v1__jobs__serializers__JobResponseSerializer 중 이 기능에 필요한 필드) */
export interface JobDetailResponse {
  id: number;
  status: string;
  due_time?: string;
  annual_from?: number;
  annual_to?: number;
  detail?: JobDetail;
  category_tags?: JobCategoryTags;
  skill_tags?: JobTag[];
  url: string;
}

/** PRD 5-1절 자격요건 뱃지 카테고리 */
export type QualificationBadgeCategory = "major" | "enrollment" | "portfolio" | "tool";

export interface QualificationBadge {
  category: QualificationBadgeCategory;
  label: string;
}

/**
 * 대시보드에서 렌더링하는, 목록 + 상세 + 뱃지 추출 결과를 합친 DTO.
 * `/api/jobs` Route Handler가 목록/상세 응답을 병합해 만들어 준다.
 */
export interface JobWithBadges {
  id: number;
  position: string;
  company: JobCompanySummary;
  url: string;
  due_time?: string;
  address?: JobListAddress;
  category_tags?: JobCategoryTags;
  annual_from?: number;
  annual_to?: number;
  /** annual_from이 0(또는 미기재)이면 true — "진짜 신입 가능" */
  isTrulyEntryLevel: boolean;
  /** 예: "0년 이상", "0~3년" */
  entryLevelSupportingText: string;
  qualificationBadges: QualificationBadge[];
  /** 카테고리 규칙에 매칭되지 않은 requirements 줄 ("기타 자격요건") */
  otherLines: string[];
  preferredPoints?: string;
  benefits?: string;
}
