export type MapMarkerKind = "deadline" | "interested" | "applied";

export interface MapMarkerData {
  id: string | number;
  lat: number;
  lng: number;
  kind: MapMarkerKind;
  companyName: string;
  position: string;
  /** 마감일 (ISO 문자열). 상시채용 등 없는 경우 undefined. */
  dueDate?: string;
  skillTags?: string[];
}
