import type { SkillTag } from "./types";
import { MOCK_SKILL_TAGS } from "./mockTags";

/**
 * 용어 툴팁(P2) 데모용 목업 채용 공고.
 *
 * TODO(백엔드 연동): 아직 P0-신입 맞춤 필터 대시보드(`/jobs`)가 구현되지 않아
 * 실제 공고 리스트/상세 화면이 없다. 이 파일은 skill_tags가 실제 화면 맥락에서
 * 어떻게 쓰이는지 보여주기 위한 임시 데모 데이터이며, `/jobs`/`/jobs/{job_id}`
 * 구현 시 이 파일은 삭제하고 실제 API 응답으로 교체한다.
 *
 * 주의(openapi.json 기준): 원티드 API의 공고 상세(`skill_tags`) 응답 항목은
 * 실제로는 `{id, text}` 형태다. 반면 이 프로젝트의 `SkillTag` 타입(`src/lib/types.ts`)은
 * `/tags/skills` 응답 기준 `{id, title}`으로 정의돼 있다. 이번 데모/컴포넌트는
 * 지침에 따라 기존 `SkillTag { id, title }`을 그대로 재사용하므로, 실제 공고
 * 상세 연동 시에는 `text` -> `title` 매핑(또는 타입 재정의)이 필요하다.
 */
export interface MockJobPosting {
  id: number;
  companyName: string;
  position: string;
  location: string;
  dueDate: string;
  /** 진짜 신입 가능 여부 배지 (P0 로직 결과를 임시로 하드코딩) */
  isEntryFriendly: boolean;
  skillTags: SkillTag[];
}

function findSkill(id: number): SkillTag {
  const found = MOCK_SKILL_TAGS.find((tag) => tag.id === id);
  if (!found) {
    throw new Error(`mockJobs: MOCK_SKILL_TAGS에 없는 id(${id})를 참조했습니다.`);
  }
  return found;
}

export const MOCK_JOB_POSTINGS: MockJobPosting[] = [
  {
    id: 24090,
    companyName: "원티드랩",
    position: "프론트엔드 개발자 (신입)",
    location: "서울 송파구",
    dueDate: "2026-08-15",
    isEntryFriendly: true,
    skillTags: [1024, 663, 1025, 1600].map(findSkill),
  },
  {
    id: 30211,
    companyName: "코드스퀘어",
    position: "백엔드 개발자 (신입~1년)",
    location: "서울 강남구",
    dueDate: "2026-07-28",
    isEntryFriendly: true,
    skillTags: [1540, 1200, 1201, 1400, 1450].map(findSkill),
  },
  {
    id: 30987,
    companyName: "스튜디오 라플",
    position: "UX/UI 디자이너 (주니어)",
    location: "서울 성동구",
    dueDate: "2026-07-20",
    isEntryFriendly: false,
    skillTags: [1700, 1701, 1702, 1704].map(findSkill),
  },
];
