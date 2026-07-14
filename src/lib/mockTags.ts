import type { CategoryTag, SkillTag } from "./types";

/**
 * TODO(백엔드 연동): 아래 데이터는 실제 원티드 API 응답을 대체하는 임시 목업이다.
 * - 관심 직군: 실제로는 `/tags/categories` 응답(GET, ClientId/Secret 인증 필요)을 사용해야 한다.
 * - 관심 스킬: 실제로는 `/tags/skills?keyword=` 자동완성 응답을 사용해야 한다.
 * 이 프로젝트는 아직 API 인증 정보를 다루는 서버 레이어가 없어(자체 DB/인증 미구현 단계),
 * 필드 구조(id/title/parent_id/sub_tags)만 openapi.json 스펙과 동일하게 맞춰 두었다.
 * 실제 연동 시 이 파일을 API 호출 함수로 교체하면 된다.
 */
export const MOCK_CATEGORY_TAGS: CategoryTag[] = [
  {
    id: 518,
    title: "개발",
    sub_tags: [
      { id: 873, parent_id: 518, title: "웹 개발자" },
      { id: 872, parent_id: 518, title: "서버 개발자" },
      { id: 655, parent_id: 518, title: "프론트엔드 개발자" },
      { id: 660, parent_id: 518, title: "안드로이드 개발자" },
      { id: 674, parent_id: 518, title: "iOS 개발자" },
    ],
  },
  {
    id: 519,
    title: "디자인",
    sub_tags: [
      { id: 703, parent_id: 519, title: "UX/UI 디자이너" },
      { id: 706, parent_id: 519, title: "프로덕트 디자이너" },
      { id: 709, parent_id: 519, title: "그래픽 디자이너" },
      { id: 712, parent_id: 519, title: "BX/브랜드 디자이너" },
    ],
  },
  {
    id: 520,
    title: "마케팅",
    sub_tags: [
      { id: 810, parent_id: 520, title: "퍼포먼스 마케터" },
      { id: 811, parent_id: 520, title: "콘텐츠 마케터" },
      { id: 812, parent_id: 520, title: "브랜드 마케터" },
    ],
  },
  {
    id: 521,
    title: "기획·경영",
    sub_tags: [
      { id: 901, parent_id: 521, title: "서비스 기획자" },
      { id: 902, parent_id: 521, title: "PM" },
      { id: 903, parent_id: 521, title: "데이터 분석가" },
    ],
  },
];

const MOCK_SKILL_TAGS: SkillTag[] = [
  { id: 1540, title: "Java" },
  { id: 517, title: "JavaScript" },
  { id: 663, title: "TypeScript" },
  { id: 1024, title: "React" },
  { id: 1025, title: "Next.js" },
  { id: 899, title: "Vue.js" },
  { id: 1102, title: "Node.js" },
  { id: 1200, title: "Spring" },
  { id: 1201, title: "Spring Boot" },
  { id: 1300, title: "Python" },
  { id: 1301, title: "Django" },
  { id: 1400, title: "MySQL" },
  { id: 1401, title: "PostgreSQL" },
  { id: 1450, title: "AWS" },
  { id: 1451, title: "Docker" },
  { id: 1452, title: "Kubernetes" },
  { id: 1600, title: "Git" },
  { id: 1700, title: "Figma" },
  { id: 1701, title: "Zeplin" },
  { id: 1702, title: "Photoshop" },
  { id: 1703, title: "Illustrator" },
  { id: 1704, title: "Sketch" },
  { id: 1800, title: "SQL" },
  { id: 1801, title: "Excel" },
  { id: 1900, title: "GA(Google Analytics)" },
  { id: 1901, title: "SQL Tuning" },
  { id: 2000, title: "Swift" },
  { id: 2001, title: "Kotlin" },
];

/**
 * `/tags/skills?keyword=` 자동완성 목업.
 * TODO(백엔드 연동): 실제로는 서버를 통해 원티드 API를 호출해야 한다
 * (client_secret을 프론트엔드에 노출하면 안 되므로 반드시 서버 경유 필요).
 */
export function searchMockSkillTags(keyword: string): SkillTag[] {
  const trimmed = keyword.trim().toLowerCase();
  if (!trimmed) return [];
  return MOCK_SKILL_TAGS.filter((tag) =>
    tag.title.toLowerCase().includes(trimmed)
  ).slice(0, 8);
}
