import type { MapMarkerData } from "@/components/map/types";

/**
 * P5 지도 위젯 미리보기용 목업 마커.
 * TODO(P0 연동): 실제로는 P0 필터링 결과 + `/jobs/{job_id}`의 `address.geo_location`으로 대체.
 */
export const MOCK_MAP_MARKERS: MapMarkerData[] = [
  {
    id: 1,
    lat: 37.4979,
    lng: 127.0276,
    kind: "deadline",
    companyName: "강남언니(힐링페이퍼)",
    position: "프론트엔드 개발자",
    dueDate: "2026-07-16",
    skillTags: ["React", "TypeScript"],
  },
  {
    id: 2,
    lat: 37.4019,
    lng: 127.1086,
    kind: "deadline",
    companyName: "카카오",
    position: "백엔드 개발자",
    dueDate: "2026-07-20",
    skillTags: ["Java", "Spring Boot"],
  },
  {
    id: 3,
    lat: 37.5219,
    lng: 126.9245,
    kind: "deadline",
    companyName: "원티드랩",
    position: "UX/UI 디자이너",
    dueDate: "2026-08-30",
    skillTags: ["Figma"],
  },
  {
    id: 4,
    lat: 37.5547,
    lng: 126.9707,
    kind: "interested",
    companyName: "토스",
    position: "iOS 개발자",
    skillTags: ["Swift"],
  },
  {
    id: 5,
    lat: 37.5013,
    lng: 127.0396,
    kind: "applied",
    companyName: "당근마켓",
    position: "서버 개발자",
    dueDate: "2026-07-25",
    skillTags: ["Node.js", "Kotlin"],
  },
];
