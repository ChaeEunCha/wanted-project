import type {
  CategoryTag,
  JobCategoryTags,
  JobDetailResponse,
  JobListItem,
  JobTag,
} from "@/lib/types";

// 이 모듈은 process.env.client_id/client_secret을 직접 읽으므로
// Route Handler 등 서버 코드에서만 import해야 한다 (Client Component에서 import 금지).

// openapi.json의 servers는 "/v1"라는 상대 경로만 명시할 뿐 호스트를 담고 있지 않다.
// 원티드 오픈API 공식 호스트(https://openapi.wanted.jobs)를 여기서 직접 결합한다.
const WANTED_API_BASE_URL = "https://openapi.wanted.jobs/v1";

function getAuthHeaders(): HeadersInit {
  const clientId = process.env.client_id;
  const clientSecret = process.env.client_secret;
  if (!clientId || !clientSecret) {
    throw new Error(
      "원티드 API 인증 정보(client_id/client_secret)가 설정되지 않았어요. 저장소 루트의 .env 파일을 확인해 주세요."
    );
  }
  return {
    "wanted-client-id": clientId,
    "wanted-client-secret": clientSecret,
  };
}

async function wantedFetch<T>(path: string, searchParams?: URLSearchParams): Promise<T> {
  const query = searchParams?.toString();
  const url = `${WANTED_API_BASE_URL}${path}${query ? `?${query}` : ""}`;
  const response = await fetch(url, { headers: getAuthHeaders(), cache: "no-store" });
  if (!response.ok) {
    throw new Error(`원티드 API 호출에 실패했어요 (${response.status}): ${path}`);
  }
  return response.json() as Promise<T>;
}

// 아래 Wire* 타입/normalize 함수들은 실제 라이브 API 응답을 직접 호출해 확인한 결과,
// openapi.json 문서상의 스키마와 다른 부분이 있어 방어적으로 두 형태를 모두 허용한다:
// - 목록/상세 공고의 포지션명이 문서상 `position`이 아니라 실제로는 `name`으로 내려온다.
// - `skill_tags`/`category_tags`의 태그 항목이 문서상 `{id, text}`가 아니라 실제로는
//   `{id, title}`로 내려오고(게다가 `id`가 null인 경우도 있다), `text`/`title` 둘 다 허용한다.
// - `/tags/categories` 응답의 최상위 키가 문서상 `tags`가 아니라 실제로는 `data`다.
interface WireTag {
  id?: number | null;
  text?: string;
  title?: string;
}

function normalizeTag(tag: WireTag): JobTag {
  return { id: tag.id ?? 0, text: tag.text ?? tag.title ?? "" };
}

interface WireCategoryTags {
  parent_tag?: WireTag;
  child_tags?: WireTag[];
}

function normalizeCategoryTags(raw?: WireCategoryTags): JobCategoryTags | undefined {
  if (!raw) return undefined;
  return {
    parent_tag: raw.parent_tag ? normalizeTag(raw.parent_tag) : undefined,
    child_tags: raw.child_tags?.map(normalizeTag),
  };
}

interface WireJobListItem {
  id: number;
  status: string;
  due_time?: string | null;
  position?: string;
  name?: string;
  company: { id: number; name: string };
  address?: { country?: string; location?: string; full_location?: string };
  category_tags?: WireCategoryTags;
  url: string;
}

function normalizeJobListItem(raw: WireJobListItem): JobListItem {
  return {
    id: raw.id,
    status: raw.status,
    due_time: raw.due_time ?? undefined,
    position: raw.position ?? raw.name ?? "",
    company: raw.company,
    address: raw.address,
    category_tags: normalizeCategoryTags(raw.category_tags),
    url: raw.url,
  };
}

interface WireJobDetail {
  position?: string;
  name?: string;
  intro?: string;
  main_tasks?: string;
  requirements?: string;
  preferred_points?: string;
  benefits?: string;
  hire_rounds?: string;
}

interface WireJobDetailResponse {
  id: number;
  status: string;
  due_time?: string | null;
  annual_from?: number;
  annual_to?: number;
  detail?: WireJobDetail;
  category_tags?: WireCategoryTags;
  skill_tags?: WireTag[];
  address?: {
    country?: string;
    location?: string;
    full_location?: string;
    geo_location?: { location?: { lat: number; lng: number } };
  };
  url: string;
}

function normalizeJobDetailResponse(raw: WireJobDetailResponse): JobDetailResponse {
  return {
    id: raw.id,
    status: raw.status,
    due_time: raw.due_time ?? undefined,
    annual_from: raw.annual_from,
    annual_to: raw.annual_to,
    detail: raw.detail
      ? {
          position: raw.detail.position ?? raw.detail.name,
          intro: raw.detail.intro,
          main_tasks: raw.detail.main_tasks,
          requirements: raw.detail.requirements,
          preferred_points: raw.detail.preferred_points,
          benefits: raw.detail.benefits,
          hire_rounds: raw.detail.hire_rounds,
        }
      : undefined,
    category_tags: normalizeCategoryTags(raw.category_tags),
    skill_tags: raw.skill_tags?.map(normalizeTag),
    // 목록(JobListAddressResponseSerializer)과 달리 상세 응답의 주소에는 geo_location이 실려 온다
    // (P5 마감임박 지도 위젯이 여기서 좌표를 얻는다 — PRD 5-7절).
    address: raw.address
      ? {
          country: raw.address.country,
          location: raw.address.location,
          full_location: raw.address.full_location,
          geo_location: raw.address.geo_location?.location
            ? { location: raw.address.geo_location.location }
            : undefined,
        }
      : undefined,
    url: raw.url,
  };
}

export interface JobListParams {
  categoryTags?: number[];
  years?: number[];
  locations?: string[];
  offset?: number;
  limit?: number;
}

export interface JobListResult {
  jobs: JobListItem[];
  hasNext: boolean;
}

export async function fetchJobList(params: JobListParams): Promise<JobListResult> {
  const searchParams = new URLSearchParams();
  params.categoryTags?.forEach((id) => searchParams.append("category_tags", String(id)));
  // 라이브 API 확인 결과 `years`/`locations` 모두 단일·반복 키 형태로는 무시되거나
  // (locations는 빈 결과, years는 500) 동작하지 않고, `years[]`/`locations[]` 브래킷
  // 표기만 정상 동작한다 (openapi.json에는 명시되지 않은 동작).
  params.years?.forEach((year) => searchParams.append("years[]", String(year)));
  params.locations?.forEach((location) => searchParams.append("locations[]", location));
  if (params.offset !== undefined) searchParams.set("offset", String(params.offset));
  if (params.limit !== undefined) searchParams.set("limit", String(params.limit));

  const data = await wantedFetch<{
    data: WireJobListItem[];
    links?: { prev?: string; next?: string };
  }>("/jobs", searchParams);
  return {
    jobs: (data.data ?? []).map(normalizeJobListItem),
    hasNext: Boolean(data.links?.next),
  };
}

export async function fetchJobDetail(jobId: number): Promise<JobDetailResponse> {
  const raw = await wantedFetch<WireJobDetailResponse>(`/jobs/${jobId}`);
  return normalizeJobDetailResponse(raw);
}

export async function fetchCategoryTags(): Promise<CategoryTag[]> {
  const data = await wantedFetch<{ tags?: CategoryTag[]; data?: CategoryTag[] }>(
    "/tags/categories"
  );
  return data.tags ?? data.data ?? [];
}
